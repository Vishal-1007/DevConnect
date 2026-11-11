package com.developersconnect.matching.service;

import com.developersconnect.matching.dto.LiveMatchActionRequest;
import com.developersconnect.matching.dto.LiveMatchAssignmentResponse;
import com.developersconnect.matching.dto.LiveMatchStatusResponse;
import com.developersconnect.matching.model.LiveMatchAssignment;
import com.developersconnect.matching.model.LivePoolMember;
import com.developersconnect.matching.repository.LiveMatchAssignmentRepository;
import com.developersconnect.matching.repository.LivePoolMemberRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LiveMatchingService {

    static final String ROLE_MENTOR = "MENTOR";
    static final String ROLE_LEARNER = "LEARNER";

    static final String POOL_OFFLINE = "OFFLINE";
    static final String POOL_AVAILABLE = "AVAILABLE";
    static final String POOL_PENDING = "PENDING";
    static final String POOL_BUSY = "BUSY";

    static final String ASSIGN_PENDING = "PENDING_ACCEPT";
    static final String ASSIGN_ACTIVE = "ACTIVE";
    static final String ASSIGN_REJECTED = "REJECTED";
    static final String ASSIGN_CANCELLED = "CANCELLED";
    static final String ASSIGN_EXPIRED = "EXPIRED";
    static final String ASSIGN_ENDED = "ENDED";

    static final Duration PENDING_TIMEOUT = Duration.ofSeconds(30);

    private final LivePoolMemberRepository poolRepository;
    private final LiveMatchAssignmentRepository assignmentRepository;
    private final MatchEventNotifier eventNotifier;
    private final MatchIndexService matchIndexService;

    public LiveMatchingService(
        LivePoolMemberRepository poolRepository,
        LiveMatchAssignmentRepository assignmentRepository,
        MatchEventNotifier eventNotifier,
        MatchIndexService matchIndexService
    ) {
        this.poolRepository = poolRepository;
        this.assignmentRepository = assignmentRepository;
        this.eventNotifier = eventNotifier;
        this.matchIndexService = matchIndexService;
    }

    @Transactional
    public LiveMatchStatusResponse mentorGoLive(UUID mentorId, LiveMatchActionRequest request) {
        upsertIndex(mentorId, request);

        LivePoolMember member = poolRepository.findByUserIdForUpdate(mentorId).orElseGet(LivePoolMember::new);
        if (member.getUserId() == null) {
            member.setUserId(mentorId);
        }

        Optional<LiveMatchAssignment> active = assignmentRepository.findActiveForMentor(mentorId);
        if (active.isPresent()) {
            LiveMatchAssignment existing = active.get();
            return toStatus(member, existing, "Already in a live match flow.");
        }

        member.setRole(ROLE_MENTOR);
        member.setLiveEnabled(true);
        member.setPoolStatus(POOL_AVAILABLE);
        member.setCriteria(request.criteria());
        member.setExperienceLevel(request.experienceLevel());
        poolRepository.save(member);

        tryMatchWaitingLearners();

        return toStatus(member, null, "You are live and available for learners.");
    }

    @Transactional
    public LiveMatchStatusResponse mentorGoOffline(UUID mentorId) {
        LivePoolMember member = poolRepository.findByUserIdForUpdate(mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not in live pool"));

        if (!ROLE_MENTOR.equals(member.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only mentors can go offline from live pool");
        }

        assignmentRepository.findActiveForMentor(mentorId).ifPresent(active -> {
            if (ASSIGN_PENDING.equals(active.getStatus())) {
                expireAssignment(active, ASSIGN_CANCELLED, true);
            } else if (ASSIGN_ACTIVE.equals(active.getStatus())) {
                endAssignment(active, ASSIGN_ENDED);
            }
        });

        member.setLiveEnabled(false);
        member.setPoolStatus(POOL_OFFLINE);
        poolRepository.save(member);

        return toStatus(member, null, "You are offline and removed from the matching pool.");
    }

    @Transactional
    public LiveMatchStatusResponse learnerSearch(UUID learnerId, LiveMatchActionRequest request) {
        upsertIndex(learnerId, request);

        LivePoolMember member = poolRepository.findByUserIdForUpdate(learnerId).orElseGet(LivePoolMember::new);
        if (member.getUserId() == null) {
            member.setUserId(learnerId);
        }

        Optional<LiveMatchAssignment> existing = assignmentRepository.findActiveForLearner(learnerId);
        if (existing.isPresent()) {
            return toStatus(member, existing.get(), "Already in a live match flow.");
        }

        member.setRole(ROLE_LEARNER);
        member.setLiveEnabled(false);
        member.setPoolStatus(POOL_AVAILABLE);
        member.setCriteria(request.criteria());
        member.setExperienceLevel(request.experienceLevel());
        poolRepository.save(member);

        Optional<LiveMatchAssignment> assigned = tryAssignMentorToLearner(learnerId, request.criteria());
        if (assigned.isPresent()) {
            LiveMatchAssignment assignment = assigned.get();
            LivePoolMember refreshed = poolRepository.findById(learnerId).orElse(member);
            return toStatus(refreshed, assignment, "Waiting for mentor to accept.");
        }

        return toStatus(member, null, "Searching for an available mentor.");
    }

    @Transactional(readOnly = true)
    public LiveMatchStatusResponse getStatus(UUID userId) {
        LivePoolMember member = poolRepository.findById(userId).orElse(null);
        if (member == null || POOL_OFFLINE.equals(member.getPoolStatus()) && !member.isLiveEnabled()) {
            return new LiveMatchStatusResponse(
                null, POOL_OFFLINE, false, null, null, null, null, null, null,
                "Not in live matching pool."
            );
        }

        Optional<LiveMatchAssignment> mentorActive = assignmentRepository.findActiveForMentor(userId);
        Optional<LiveMatchAssignment> learnerActive = assignmentRepository.findActiveForLearner(userId);
        LiveMatchAssignment active = mentorActive.or(() -> learnerActive).orElse(null);

        return toStatus(member, active, null);
    }

    @Transactional
    public LiveMatchAssignmentResponse acceptAssignment(UUID mentorId, UUID assignmentId) {
        LiveMatchAssignment assignment = lockAssignmentForMentor(mentorId, assignmentId);

        if (!ASSIGN_PENDING.equals(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment is not pending acceptance");
        }

        assignment.setStatus(ASSIGN_ACTIVE);
        assignment.setAcceptedAt(Instant.now());
        assignment.setExpiresAt(null);
        assignmentRepository.save(assignment);

        LivePoolMember mentor = poolRepository.findByUserIdForUpdate(mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not in pool"));
        mentor.setPoolStatus(POOL_BUSY);
        poolRepository.save(mentor);

        LivePoolMember learner = poolRepository.findByUserIdForUpdate(assignment.getLearnerId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not in pool"));
        learner.setPoolStatus(POOL_BUSY);
        poolRepository.save(learner);

        notifyMatchAccepted(assignment);
        return toAssignmentResponse(assignment);
    }

    @Transactional
    public LiveMatchAssignmentResponse rejectAssignment(UUID mentorId, UUID assignmentId) {
        LiveMatchAssignment assignment = lockAssignmentForMentor(mentorId, assignmentId);

        if (!ASSIGN_PENDING.equals(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment is not pending acceptance");
        }

        UUID learnerId = assignment.getLearnerId();
        assignment.setStatus(ASSIGN_REJECTED);
        assignment.setEndedAt(Instant.now());
        assignmentRepository.save(assignment);

        releaseMentorToAvailable(mentorId);
        requeueLearner(learnerId, assignment.getCriteria());

        notifyMatchRejected(assignment);
        tryAssignMentorToLearner(learnerId, assignment.getCriteria());

        return toAssignmentResponse(assignment);
    }

    @Transactional
    public LiveMatchStatusResponse cancel(UUID userId) {
        LivePoolMember member = poolRepository.findByUserIdForUpdate(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not in live pool"));

        Optional<LiveMatchAssignment> asMentor = assignmentRepository.findActiveForMentor(userId);
        Optional<LiveMatchAssignment> asLearner = assignmentRepository.findActiveForLearner(userId);

        if (asLearner.isPresent()) {
            LiveMatchAssignment assignment = asLearner.get();
            if (ASSIGN_PENDING.equals(assignment.getStatus())) {
                assignment.setStatus(ASSIGN_CANCELLED);
                assignment.setEndedAt(Instant.now());
                assignmentRepository.save(assignment);
                releaseMentorToAvailable(assignment.getMentorId());
                notifyMatchCancelled(assignment, userId);
            } else if (ASSIGN_ACTIVE.equals(assignment.getStatus())) {
                endAssignment(assignment, ASSIGN_ENDED);
            }
            member.setPoolStatus(POOL_OFFLINE);
            poolRepository.save(member);
            return toStatus(member, null, "Match cancelled.");
        }

        if (asMentor.isPresent()) {
            LiveMatchAssignment assignment = asMentor.get();
            if (ASSIGN_PENDING.equals(assignment.getStatus())) {
                expireAssignment(assignment, ASSIGN_CANCELLED, true);
            } else if (ASSIGN_ACTIVE.equals(assignment.getStatus())) {
                endAssignment(assignment, ASSIGN_ENDED);
            }
            if (member.isLiveEnabled()) {
                member.setPoolStatus(POOL_AVAILABLE);
            } else {
                member.setPoolStatus(POOL_OFFLINE);
            }
            poolRepository.save(member);
            return toStatus(member, null, "Match cancelled.");
        }

        if (ROLE_LEARNER.equals(member.getRole())) {
            member.setPoolStatus(POOL_OFFLINE);
            poolRepository.save(member);
            return toStatus(member, null, "Search cancelled.");
        }

        if (ROLE_MENTOR.equals(member.getRole()) && member.isLiveEnabled()) {
            member.setPoolStatus(POOL_AVAILABLE);
            poolRepository.save(member);
            return toStatus(member, null, "Ready for new learners.");
        }

        member.setPoolStatus(POOL_OFFLINE);
        poolRepository.save(member);
        return toStatus(member, null, "Removed from live pool.");
    }

    @Transactional
    public LiveMatchStatusResponse endSession(UUID userId) {
        LivePoolMember member = poolRepository.findByUserIdForUpdate(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not in live pool"));

        LiveMatchAssignment assignment = assignmentRepository.findActiveForMentor(userId)
            .or(() -> assignmentRepository.findActiveForLearner(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active session"));

        if (!ASSIGN_ACTIVE.equals(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is not active");
        }

        endAssignment(assignment, ASSIGN_ENDED);

        if (ROLE_MENTOR.equals(member.getRole()) && member.isLiveEnabled()) {
            member.setPoolStatus(POOL_AVAILABLE);
        } else {
            member.setPoolStatus(POOL_OFFLINE);
        }
        poolRepository.save(member);

        UUID partnerId = userId.equals(assignment.getMentorId())
            ? assignment.getLearnerId()
            : assignment.getMentorId();
        poolRepository.findByUserIdForUpdate(partnerId).ifPresent(partner -> {
            if (ROLE_MENTOR.equals(partner.getRole()) && partner.isLiveEnabled()) {
                partner.setPoolStatus(POOL_AVAILABLE);
            } else {
                partner.setPoolStatus(POOL_OFFLINE);
            }
            poolRepository.save(partner);
        });

        tryMatchWaitingLearners();
        return toStatus(member, null, "Session ended.");
    }

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void expirePendingAssignments() {
        List<LiveMatchAssignment> expired = assignmentRepository.findExpiredPending(Instant.now());
        for (LiveMatchAssignment assignment : expired) {
            expireAssignment(assignment, ASSIGN_EXPIRED, true);
            requeueLearner(assignment.getLearnerId(), assignment.getCriteria());
            tryAssignMentorToLearner(assignment.getLearnerId(), assignment.getCriteria());
        }
    }

    private void tryMatchWaitingLearners() {
        List<LivePoolMember> mentors = poolRepository.findAvailableMentorsForUpdate(PageRequest.of(0, 20));
        for (LivePoolMember mentor : mentors) {
            if (!mentor.isLiveEnabled() || !POOL_AVAILABLE.equals(mentor.getPoolStatus())) {
                continue;
            }
            if (assignmentRepository.findActiveForMentor(mentor.getUserId()).isPresent()) {
                continue;
            }
            List<LivePoolMember> learners = poolRepository.findWaitingLearnersForUpdate(PageRequest.of(0, 1));
            if (learners.isEmpty()) {
                break;
            }
            LivePoolMember learner = learners.get(0);
            if (!POOL_AVAILABLE.equals(learner.getPoolStatus())) {
                continue;
            }
            if (assignmentRepository.findActiveForLearner(learner.getUserId()).isPresent()) {
                continue;
            }
            createPendingAssignment(mentor, learner, learner.getCriteria());
        }
    }

    private Optional<LiveMatchAssignment> tryAssignMentorToLearner(UUID learnerId, String criteria) {
        if (assignmentRepository.findActiveForLearner(learnerId).isPresent()) {
            return assignmentRepository.findActiveForLearner(learnerId);
        }

        List<LivePoolMember> mentors = poolRepository.findAvailableMentorsForUpdate(PageRequest.of(0, 1));
        if (mentors.isEmpty()) {
            return Optional.empty();
        }

        LivePoolMember mentor = mentors.get(0);
        if (!mentor.isLiveEnabled() || !POOL_AVAILABLE.equals(mentor.getPoolStatus())) {
            return Optional.empty();
        }
        if (assignmentRepository.findActiveForMentor(mentor.getUserId()).isPresent()) {
            return Optional.empty();
        }

        LivePoolMember learner = poolRepository.findByUserIdForUpdate(learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not in pool"));
        if (!POOL_AVAILABLE.equals(learner.getPoolStatus())) {
            return Optional.empty();
        }

        LiveMatchAssignment assignment = createPendingAssignment(mentor, learner, criteria);
        return Optional.of(assignment);
    }

    private LiveMatchAssignment createPendingAssignment(LivePoolMember mentor, LivePoolMember learner, String criteria) {
        mentor.setPoolStatus(POOL_PENDING);
        poolRepository.save(mentor);

        learner.setPoolStatus(POOL_PENDING);
        poolRepository.save(learner);

        LiveMatchAssignment assignment = new LiveMatchAssignment();
        assignment.setMentorId(mentor.getUserId());
        assignment.setLearnerId(learner.getUserId());
        assignment.setStatus(ASSIGN_PENDING);
        assignment.setCriteria(criteria);
        assignment.setExpiresAt(Instant.now().plus(PENDING_TIMEOUT));
        LiveMatchAssignment saved = assignmentRepository.save(assignment);

        notifyMatchRequest(saved);
        return saved;
    }

    private void expireAssignment(LiveMatchAssignment assignment, String terminalStatus, boolean releaseMentor) {
        assignment.setStatus(terminalStatus);
        assignment.setEndedAt(Instant.now());
        assignmentRepository.save(assignment);

        if (releaseMentor) {
            releaseMentorToAvailable(assignment.getMentorId());
        }

        poolRepository.findByUserIdForUpdate(assignment.getLearnerId()).ifPresent(learner -> {
            if (ASSIGN_EXPIRED.equals(terminalStatus) || ASSIGN_CANCELLED.equals(terminalStatus)) {
                learner.setPoolStatus(POOL_AVAILABLE);
                poolRepository.save(learner);
            }
        });

        if (ASSIGN_EXPIRED.equals(terminalStatus)) {
            notifyMatchExpired(assignment);
        }
    }

    private void endAssignment(LiveMatchAssignment assignment, String terminalStatus) {
        assignment.setStatus(terminalStatus);
        assignment.setEndedAt(Instant.now());
        assignmentRepository.save(assignment);

        releaseMentorToAvailable(assignment.getMentorId());

        poolRepository.findByUserIdForUpdate(assignment.getLearnerId()).ifPresent(learner -> {
            learner.setPoolStatus(POOL_OFFLINE);
            poolRepository.save(learner);
        });

        notifyMatchEnded(assignment);
    }

    private void releaseMentorToAvailable(UUID mentorId) {
        poolRepository.findByUserIdForUpdate(mentorId).ifPresent(mentor -> {
            if (mentor.isLiveEnabled()) {
                mentor.setPoolStatus(POOL_AVAILABLE);
            } else {
                mentor.setPoolStatus(POOL_OFFLINE);
            }
            poolRepository.save(mentor);
        });
    }

    private void requeueLearner(UUID learnerId, String criteria) {
        poolRepository.findByUserIdForUpdate(learnerId).ifPresent(learner -> {
            learner.setPoolStatus(POOL_AVAILABLE);
            if (criteria != null) {
                learner.setCriteria(criteria);
            }
            poolRepository.save(learner);
        });
    }

    private LiveMatchAssignment lockAssignmentForMentor(UUID mentorId, UUID assignmentId) {
        LiveMatchAssignment assignment = assignmentRepository.findByIdForUpdate(assignmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        if (!assignment.getMentorId().equals(mentorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your assignment");
        }
        return assignment;
    }

    private void upsertIndex(UUID userId, LiveMatchActionRequest request) {
        matchIndexService.upsert(userId, new com.developersconnect.matching.dto.UpsertMatchIndexRequest(
            request.experienceLevel(),
            request.skills()
        ));
    }

    private void notifyMatchRequest(LiveMatchAssignment assignment) {
        eventNotifier.notifyUser(
            assignment.getMentorId().toString(),
            "match-request",
            assignment.getLearnerId().toString(),
            "Learner",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_LEARNER,
            ASSIGN_PENDING
        );
        eventNotifier.notifyUser(
            assignment.getLearnerId().toString(),
            "match-assigned",
            assignment.getMentorId().toString(),
            "Mentor",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_MENTOR,
            ASSIGN_PENDING
        );
    }

    private void notifyMatchAccepted(LiveMatchAssignment assignment) {
        eventNotifier.notifyUser(
            assignment.getLearnerId().toString(),
            "match-accepted",
            assignment.getMentorId().toString(),
            "Mentor",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_MENTOR,
            ASSIGN_ACTIVE
        );
        eventNotifier.notifyUser(
            assignment.getMentorId().toString(),
            "match-accepted",
            assignment.getLearnerId().toString(),
            "Learner",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_LEARNER,
            ASSIGN_ACTIVE
        );
    }

    private void notifyMatchRejected(LiveMatchAssignment assignment) {
        eventNotifier.notifyUser(
            assignment.getLearnerId().toString(),
            "match-rejected",
            assignment.getMentorId().toString(),
            "Mentor",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_MENTOR,
            ASSIGN_REJECTED
        );
    }

    private void notifyMatchExpired(LiveMatchAssignment assignment) {
        eventNotifier.notifyUser(
            assignment.getLearnerId().toString(),
            "match-expired",
            assignment.getMentorId().toString(),
            "Mentor",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_MENTOR,
            ASSIGN_EXPIRED
        );
    }

    private void notifyMatchCancelled(LiveMatchAssignment assignment, UUID cancelledBy) {
        UUID target = cancelledBy.equals(assignment.getLearnerId())
            ? assignment.getMentorId()
            : assignment.getLearnerId();
        eventNotifier.notifyUser(
            target.toString(),
            "match-cancelled",
            cancelledBy.toString(),
            "User",
            assignment.getId().toString(),
            assignment.getCriteria(),
            null,
            ASSIGN_CANCELLED
        );
    }

    private void notifyMatchEnded(LiveMatchAssignment assignment) {
        eventNotifier.notifyUser(
            assignment.getLearnerId().toString(),
            "match-ended",
            assignment.getMentorId().toString(),
            "Mentor",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_MENTOR,
            ASSIGN_ENDED
        );
        eventNotifier.notifyUser(
            assignment.getMentorId().toString(),
            "match-ended",
            assignment.getLearnerId().toString(),
            "Learner",
            assignment.getId().toString(),
            assignment.getCriteria(),
            ROLE_LEARNER,
            ASSIGN_ENDED
        );
    }

    private LiveMatchStatusResponse toStatus(LivePoolMember member, LiveMatchAssignment assignment, String message) {
        UUID partnerId = null;
        String partnerRole = null;
        String assignmentStatus = null;
        UUID assignmentId = null;
        Instant expiresAt = null;

        if (assignment != null) {
            assignmentId = assignment.getId();
            assignmentStatus = assignment.getStatus();
            expiresAt = assignment.getExpiresAt();
            if (ROLE_MENTOR.equals(member.getRole())) {
                partnerId = assignment.getLearnerId();
                partnerRole = ROLE_LEARNER;
            } else {
                partnerId = assignment.getMentorId();
                partnerRole = ROLE_MENTOR;
            }
        }

        return new LiveMatchStatusResponse(
            member.getRole(),
            member.getPoolStatus(),
            member.isLiveEnabled(),
            assignmentId,
            assignmentStatus,
            partnerId,
            partnerRole,
            member.getCriteria(),
            expiresAt,
            message
        );
    }

    private LiveMatchAssignmentResponse toAssignmentResponse(LiveMatchAssignment assignment) {
        return new LiveMatchAssignmentResponse(
            assignment.getId(),
            assignment.getMentorId(),
            assignment.getLearnerId(),
            assignment.getStatus(),
            assignment.getCriteria(),
            assignment.getExpiresAt(),
            assignment.getAcceptedAt(),
            assignment.getCreatedAt()
        );
    }
}
