package com.developersconnect.mentor.service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.mentor.dto.AdminMentorApplicationDetailResponse;
import com.developersconnect.mentor.dto.AdminRejectApplicationRequest;
import com.developersconnect.mentor.dto.AdminRequestInfoRequest;
import com.developersconnect.mentor.dto.ApplicationTimelineEventDto;
import com.developersconnect.mentor.dto.MentorApplicationResponse;
import com.developersconnect.mentor.dto.ReviewApplicationRequest;
import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AdminMentorApplicationService {

    private static final TypeReference<List<ApplicationTimelineEventDto>> TIMELINE_TYPE =
        new TypeReference<>() {};

    private final MentorApplicationRepository applicationRepository;
    private final MentorProfileService mentorProfileService;
    private final MentorApplicationService applicationService;
    private final MentorApplicationNotificationService notificationService;
    private final ObjectMapper objectMapper;

    public AdminMentorApplicationService(
        MentorApplicationRepository applicationRepository,
        MentorProfileService mentorProfileService,
        MentorApplicationService applicationService,
        MentorApplicationNotificationService notificationService,
        ObjectMapper objectMapper
    ) {
        this.applicationRepository = applicationRepository;
        this.mentorProfileService = mentorProfileService;
        this.applicationService = applicationService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AdminMentorApplicationDetailResponse> listForAdmin() {
        return applicationRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(app -> app.getStatus() != MentorApplication.Status.DRAFT)
            .map(this::toDetailResponse)
            .toList();
    }

    @Transactional
    public AdminMentorApplicationDetailResponse getForAdmin(UUID applicationId, String adminUsername) {
        MentorApplication app = requireApplication(applicationId);
        appendTimeline(app, "ADMIN_VIEWED", "Admin Viewed", adminUsername);
        applicationRepository.save(app);
        return toDetailResponse(app);
    }

    @Transactional
    public MentorApplicationResponse approve(UUID applicationId, String adminUsername, ReviewApplicationRequest request) {
        MentorApplication app = requireApplication(applicationId);
        if (app.getStatus() != MentorApplication.Status.PENDING && app.getStatus() != MentorApplication.Status.INFO_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application is not pending review");
        }
        MentorApplicationResponse response = mentorProfileService.approveApplication(applicationId, adminUsername, request);
        MentorApplication updated = requireApplication(applicationId);
        appendTimeline(updated, "APPROVED", "Application Approved", adminUsername);
        applicationRepository.save(updated);
        notificationService.notifyUser(
            updated.getUserId(),
            "Mentor application approved",
            "Congratulations! Your mentor application has been approved. You can now access your mentor dashboard.",
            "mentor_application_approved"
        );
        return response;
    }

    @Transactional
    public MentorApplicationResponse reject(UUID applicationId, String adminUsername, AdminRejectApplicationRequest request) {
        MentorApplication app = requireApplication(applicationId);
        if (app.getStatus() != MentorApplication.Status.PENDING && app.getStatus() != MentorApplication.Status.INFO_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application is not pending review");
        }
        ReviewApplicationRequest review = new ReviewApplicationRequest(
            request.reviewNote() != null ? request.reviewNote() : request.reason()
        );
        MentorApplicationResponse response = mentorProfileService.rejectApplication(applicationId, adminUsername, review);
        MentorApplication updated = requireApplication(applicationId);
        updated.setReviewNote(request.reason());
        appendTimeline(updated, "REJECTED", "Application Rejected", adminUsername);
        applicationRepository.save(updated);
        notificationService.notifyUser(
            updated.getUserId(),
            "Mentor application update",
            "Your mentor application was not approved. Reason: " + request.reason(),
            "mentor_application_rejected"
        );
        return response;
    }

    @Transactional
    public AdminMentorApplicationDetailResponse requestInfo(
        UUID applicationId,
        String adminUsername,
        AdminRequestInfoRequest request
    ) {
        MentorApplication app = requireApplication(applicationId);
        if (app.getStatus() != MentorApplication.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending applications can receive info requests");
        }
        app.setStatus(MentorApplication.Status.INFO_REQUESTED);
        app.setInfoRequestMessage(request.message());
        appendTimeline(app, "INFO_REQUESTED", "More Information Requested", adminUsername);
        MentorApplication saved = applicationRepository.save(app);
        notificationService.notifyUser(
            saved.getUserId(),
            "Action required on your mentor application",
            request.message(),
            "mentor_application_info_requested"
        );
        return toDetailResponse(saved);
    }

    @Transactional
    public AdminMentorApplicationDetailResponse suspend(UUID applicationId, String adminUsername) {
        MentorApplication app = requireApplication(applicationId);
        app.setStatus(MentorApplication.Status.SUSPENDED);
        appendTimeline(app, "SUSPENDED", "Application Suspended", adminUsername);
        return toDetailResponse(applicationRepository.save(app));
    }

    @Transactional
    public AdminMentorApplicationDetailResponse saveNotes(UUID applicationId, String notes) {
        MentorApplication app = requireApplication(applicationId);
        app.setAdminInternalNotes(notes);
        return toDetailResponse(applicationRepository.save(app));
    }

    @Transactional
    public void recordSubmittedTimeline(MentorApplication app) {
        appendTimeline(app, "SUBMITTED", "Application Submitted", app.getUsername());
        if (applicationService.deserialize(app.getApplicationData()) != null) {
            var data = applicationService.deserialize(app.getApplicationData());
            if (data.resumeUrl() != null && !data.resumeUrl().isBlank()) {
                appendTimeline(app, "RESUME_UPLOADED", "Resume Uploaded", app.getUsername());
            }
            if (data.linkedinUrl() != null && !data.linkedinUrl().isBlank()) {
                appendTimeline(app, "LINKEDIN_ADDED", "LinkedIn Profile Added", app.getUsername());
            }
        }
        appendTimeline(app, "UNDER_REVIEW", "Under Review", "system");
    }

    private MentorApplication requireApplication(UUID id) {
        return applicationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
    }

    private AdminMentorApplicationDetailResponse toDetailResponse(MentorApplication app) {
        return new AdminMentorApplicationDetailResponse(
            app.getId(),
            formatApplicationCode(app),
            app.getUserId(),
            app.getUsername(),
            app.getHeadline(),
            app.getBio(),
            app.getHourlyRateCents(),
            app.getMotivation(),
            app.getStatus().name(),
            app.getReviewedBy(),
            app.getReviewNote(),
            app.getCurrentStep(),
            applicationService.deserialize(app.getApplicationData()),
            app.getAdminInternalNotes(),
            app.getInfoRequestMessage(),
            readTimeline(app),
            app.getCreatedAt(),
            app.getUpdatedAt()
        );
    }

    private String formatApplicationCode(MentorApplication app) {
        int year = app.getCreatedAt().atZone(ZoneOffset.UTC).getYear();
        String suffix = app.getId().toString().replace("-", "").substring(0, 4).toUpperCase();
        return "MR-" + year + "-" + suffix;
    }

    private List<ApplicationTimelineEventDto> readTimelineRaw(MentorApplication app) {
        if (app.getReviewTimeline() == null || app.getReviewTimeline().isBlank()) {
            return new ArrayList<>();
        }
        try {
            return new ArrayList<>(objectMapper.readValue(app.getReviewTimeline(), TIMELINE_TYPE));
        } catch (JsonProcessingException ex) {
            return new ArrayList<>();
        }
    }

    private List<ApplicationTimelineEventDto> readTimeline(MentorApplication app) {
        List<ApplicationTimelineEventDto> events = readTimelineRaw(app);
        if (!events.isEmpty()) {
            return events.stream()
                .sorted(Comparator.comparing(ApplicationTimelineEventDto::occurredAt))
                .toList();
        }
        List<ApplicationTimelineEventDto> fallback = new ArrayList<>();
        fallback.add(new ApplicationTimelineEventDto(
            "SUBMITTED", "Application Submitted", app.getCreatedAt(), app.getUsername()
        ));
        if (app.getStatus() == MentorApplication.Status.PENDING
            || app.getStatus() == MentorApplication.Status.INFO_REQUESTED) {
            fallback.add(new ApplicationTimelineEventDto(
                "UNDER_REVIEW", "Under Review", app.getUpdatedAt(), "system"
            ));
        }
        if (app.getStatus() == MentorApplication.Status.APPROVED) {
            fallback.add(new ApplicationTimelineEventDto(
                "APPROVED", "Application Approved", app.getUpdatedAt(), app.getReviewedBy()
            ));
        }
        if (app.getStatus() == MentorApplication.Status.REJECTED) {
            fallback.add(new ApplicationTimelineEventDto(
                "REJECTED", "Application Rejected", app.getUpdatedAt(), app.getReviewedBy()
            ));
        }
        return fallback;
    }

    private void appendTimeline(MentorApplication app, String type, String label, String actor) {
        List<ApplicationTimelineEventDto> events = new ArrayList<>(readTimelineRaw(app));
        events.add(new ApplicationTimelineEventDto(type, label, Instant.now(), actor));
        try {
            app.setReviewTimeline(objectMapper.writeValueAsString(events));
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not update timeline");
        }
    }
}
