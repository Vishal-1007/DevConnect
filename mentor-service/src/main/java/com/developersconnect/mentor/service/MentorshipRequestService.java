package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateMentorshipRequestDto;
import com.developersconnect.mentor.dto.MentorshipRequestResponse;
import com.developersconnect.mentor.dto.MyMentorSummaryResponse;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorStudentRecord;
import com.developersconnect.mentor.model.MentorshipRequest;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorStudentRecordRepository;
import com.developersconnect.mentor.repository.MentorshipRequestRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorshipRequestService {

    private static final Logger log = LoggerFactory.getLogger(MentorshipRequestService.class);
    static final String ACTIVE_MENTORSHIP_MESSAGE =
        "You already have an active mentorship request with this mentor.";

    private final MentorshipRequestRepository requestRepository;
    private final MentorStudentRecordRepository studentRecordRepository;
    private final MentorProfileRepository profileRepository;
    private final MentorApplicationNotificationService notificationService;
    private final MentorshipRequestValidator requestValidator;

    public MentorshipRequestService(
        MentorshipRequestRepository requestRepository,
        MentorStudentRecordRepository studentRecordRepository,
        MentorProfileRepository profileRepository,
        MentorApplicationNotificationService notificationService,
        MentorshipRequestValidator requestValidator
    ) {
        this.requestRepository = requestRepository;
        this.studentRecordRepository = studentRecordRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
        this.requestValidator = requestValidator;
    }

    @Transactional
    public MentorshipRequestResponse createRequest(UUID learnerId, String learnerName, CreateMentorshipRequestDto dto) {
        requestValidator.ensureCanCreate(dto.mentorId(), learnerId);

        MentorshipRequest request = new MentorshipRequest();
        request.setMentorId(dto.mentorId());
        request.setLearnerId(learnerId);
        request.setLearnerName(learnerName);
        request.setGoal(dto.goal().trim());
        request.setMessage(dto.message() != null ? dto.message().trim() : null);
        request.setStatus(MentorshipRequest.Status.PENDING);
        requestRepository.save(request);

        String displayName = learnerName != null && !learnerName.isBlank() ? learnerName : "A learner";
        notificationService.notifyUser(
            dto.mentorId(),
            "New mentorship request",
            "New mentorship request received from " + displayName,
            "mentorship_request"
        );

        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public List<MentorshipRequestResponse> listForLearner(UUID learnerId) {
        return requestRepository.findByLearnerIdOrderByCreatedAtDesc(learnerId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MentorshipRequestResponse> listForMentor(UUID mentorId) {
        return requestRepository.findByMentorIdOrderByCreatedAtDesc(mentorId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MentorshipRequestResponse> listPendingForMentor(UUID mentorId) {
        return requestRepository.findByMentorIdAndStatusOrderByCreatedAtDesc(
            mentorId, MentorshipRequest.Status.PENDING
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long countPendingForMentor(UUID mentorId) {
        return requestRepository.countByMentorIdAndStatus(mentorId, MentorshipRequest.Status.PENDING);
    }

    @Transactional
    public List<MyMentorSummaryResponse> listAcceptedMentorsForLearner(UUID learnerId) {
        log.info("Loading accepted mentors for studentId={}", learnerId);

        List<MentorshipRequest> acceptedRequests = requestRepository
            .findByLearnerIdAndStatusOrderByCreatedAtDesc(learnerId, MentorshipRequest.Status.ACCEPTED);
        int synced = syncAcceptedRelationships(acceptedRequests);

        List<MentorStudentRecord> activeRecords = studentRecordRepository
            .findByLearnerIdAndStatusOrderByAcceptedAtDesc(learnerId, MentorStudentRecord.STATUS_ACTIVE);

        Set<UUID> mentorIds = new LinkedHashSet<>();
        List<MyMentorSummaryResponse> mentors = new ArrayList<>();

        for (MentorStudentRecord record : activeRecords) {
            if (mentorIds.add(record.getMentorId())) {
                mentors.add(toMyMentorSummary(record.getMentorId()));
            }
        }

        for (MentorshipRequest request : acceptedRequests) {
            if (mentorIds.add(request.getMentorId())) {
                log.warn(
                    "Accepted mentorship request missing active record — mentorId={} studentId={} requestStatus=ACCEPTED",
                    request.getMentorId(), learnerId
                );
                ensureActiveStudentRecord(request);
                mentors.add(toMyMentorSummary(request.getMentorId()));
            }
        }

        log.info(
            "acceptedMentorsResponse studentId={} acceptedRequestCount={} activeRecordCount={} syncedRecords={} mentorCount={}",
            learnerId, acceptedRequests.size(), activeRecords.size(), synced, mentors.size()
        );
        for (MyMentorSummaryResponse mentor : mentors) {
            log.debug("acceptedMentor studentId={} mentorId={} mentorName={}", learnerId, mentor.mentorId(), mentor.mentorName());
        }
        return mentors;
    }

    @Transactional
    public int syncAcceptedRelationships(List<MentorshipRequest> acceptedRequests) {
        int synced = 0;
        for (MentorshipRequest request : acceptedRequests) {
            if (request.getStatus() != MentorshipRequest.Status.ACCEPTED) {
                continue;
            }
            boolean hasActiveRecord = studentRecordRepository
                .findByMentorIdAndLearnerId(request.getMentorId(), request.getLearnerId())
                .filter(record -> MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(record.getStatus()))
                .isPresent();
            if (!hasActiveRecord) {
                ensureActiveStudentRecord(request);
                synced++;
            }
        }
        return synced;
    }

    @Transactional
    public int backfillAcceptedRelationshipsFromRequests() {
        List<MentorshipRequest> accepted = requestRepository.findAllByStatus(MentorshipRequest.Status.ACCEPTED);
        if (accepted.isEmpty()) {
            return 0;
        }
        return syncAcceptedRelationships(accepted);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveRelationship(UUID mentorId, UUID learnerId) {
        boolean activeRecord = studentRecordRepository.findByMentorIdAndLearnerId(mentorId, learnerId)
            .filter(record -> MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(record.getStatus()))
            .isPresent();
        if (activeRecord) {
            return true;
        }
        return requestRepository
            .findFirstByMentorIdAndLearnerIdAndStatus(mentorId, learnerId, MentorshipRequest.Status.ACCEPTED)
            .isPresent();
    }

    @Transactional
    public MentorshipRequestResponse accept(UUID mentorId, UUID requestId) {
        MentorshipRequest request = requirePendingForMentor(mentorId, requestId);
        request.setStatus(MentorshipRequest.Status.ACCEPTED);
        requestRepository.save(request);

        log.info(
            "Request Accepted: requestId={} mentorId={} studentId={} requestStatus=ACCEPTED",
            requestId, mentorId, request.getLearnerId()
        );

        MentorStudentRecord persisted = ensureActiveStudentRecord(request);

        log.info(
            "relationshipCreated recordId={} mentorId={} studentId={} status={}",
            persisted.getId(), mentorId, request.getLearnerId(), persisted.getStatus()
        );

        notificationService.notifyUser(
            request.getLearnerId(),
            "Mentorship request accepted",
            "Your mentorship request has been accepted.",
            "mentorship_accepted"
        );

        return toResponse(request);
    }

    @Transactional
    public MentorshipRequestResponse reject(UUID mentorId, UUID requestId) {
        MentorshipRequest request = requirePendingForMentor(mentorId, requestId);
        request.setStatus(MentorshipRequest.Status.REJECTED);
        requestRepository.save(request);

        notificationService.notifyUser(
            request.getLearnerId(),
            "Mentorship request rejected",
            "Your mentorship request has been rejected.",
            "mentorship_rejected"
        );

        return toResponse(request);
    }

    private MentorshipRequest requirePendingForMentor(UUID mentorId, UUID requestId) {
        MentorshipRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!request.getMentorId().equals(mentorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your request");
        }
        if (request.getStatus() != MentorshipRequest.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        return request;
    }

    private MentorStudentRecord ensureActiveStudentRecord(MentorshipRequest request) {
        MentorStudentRecord studentRecord = studentRecordRepository
            .findByMentorIdAndLearnerId(request.getMentorId(), request.getLearnerId())
            .orElseGet(MentorStudentRecord::new);

        if (studentRecord.getId() == null) {
            studentRecord.setMentorId(request.getMentorId());
            studentRecord.setLearnerId(request.getLearnerId());
            studentRecord.setLearnerName(request.getLearnerName() != null ? request.getLearnerName() : "Student");
            studentRecord.setCategory(mapGoalToCategory(request.getGoal()));
            studentRecord.setNotes(request.getMessage());
            studentRecord.setInterviewReadinessPct(20);
            studentRecord.setBaselineProgressPct(10);
        }
        studentRecord.setStatus(MentorStudentRecord.STATUS_ACTIVE);
        if (studentRecord.getAcceptedAt() == null) {
            studentRecord.setAcceptedAt(Instant.now());
        }
        return studentRecordRepository.save(studentRecord);
    }

    private MyMentorSummaryResponse toMyMentorSummary(UUID mentorId) {
        MentorProfile profile = profileRepository.findById(mentorId).orElse(null);
        String name = profile != null
            ? firstNonBlank(profile.getFullName(), profile.getHeadline(), "Mentor")
            : "Mentor";
        return new MyMentorSummaryResponse(
            mentorId,
            name,
            profile != null ? profile.getHeadline() : null,
            profile != null ? profile.getCompany() : null,
            profile != null ? profile.getExperienceRange() : null,
            profile != null ? profile.getProfileImageUrl() : null,
            profile != null ? profile.getAverageRating() : 0.0,
            profile != null ? profile.getRatingCount() : 0L,
            profile != null && profile.isAvailable()
        );
    }

    private String mapGoalToCategory(String goal) {
        if (goal == null) return "active_project";
        return switch (goal.toLowerCase()) {
            case "interview preparation", "dsa" -> "interview_prep";
            case "system design" -> "system_design";
            case "career guidance", "job switch" -> "career_switch";
            default -> "active_project";
        };
    }

    private MentorshipRequestResponse toResponse(MentorshipRequest request) {
        MentorProfile mentorProfile = profileRepository.findById(request.getMentorId()).orElse(null);
        String mentorName = mentorProfile != null
            ? firstNonBlank(mentorProfile.getFullName(), mentorProfile.getHeadline(), "Mentor")
            : "Mentor";
        String mentorImage = mentorProfile != null ? mentorProfile.getProfileImageUrl() : null;

        return new MentorshipRequestResponse(
            request.getId(),
            request.getMentorId(),
            request.getLearnerId(),
            request.getLearnerName(),
            null,
            mentorName,
            mentorImage,
            request.getGoal(),
            request.getMessage(),
            request.getStatus().name(),
            request.getCreatedAt(),
            request.getUpdatedAt()
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
