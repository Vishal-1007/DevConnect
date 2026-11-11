package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MockInterviewDtos.AvailableSlotResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.BookInterviewBody;
import com.developersconnect.mentor.dto.MockInterviewDtos.BookingSummaryResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.CategoryCountResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.CreateRequestBody;
import com.developersconnect.mentor.dto.MockInterviewDtos.FeedbackResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.InterviewerCardResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.InterviewerDetailResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.MarketplaceStatsResponse;
import com.developersconnect.mentor.dto.MockInterviewRequestResponse;
import com.developersconnect.mentor.dto.MockInterviewSessionResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.ReviewSnippetResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.SubmitFeedbackBody;
import com.developersconnect.mentor.dto.UpcomingInterviewResponse;
import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MockInterviewFavorite;
import com.developersconnect.mentor.model.MockInterviewFeedback;
import com.developersconnect.mentor.model.MockInterviewRequest;
import com.developersconnect.mentor.model.MockInterviewRequest.Status;
import com.developersconnect.mentor.model.MockInterviewSession;
import com.developersconnect.mentor.model.MockInterviewer;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MockInterviewFavoriteRepository;
import com.developersconnect.mentor.repository.MockInterviewFeedbackRepository;
import com.developersconnect.mentor.repository.MockInterviewRequestRepository;
import com.developersconnect.mentor.repository.MockInterviewSessionRepository;
import com.developersconnect.mentor.repository.MockInterviewerRepository;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MockInterviewService {

    private static final Logger log = LoggerFactory.getLogger(MockInterviewService.class);

    private static final List<Map.Entry<String, String>> CATEGORIES = List.of(
        Map.entry("dsa", "DSA & Algorithms"),
        Map.entry("system-design", "System Design"),
        Map.entry("backend", "Backend"),
        Map.entry("frontend", "Frontend"),
        Map.entry("behavioral", "Behavioral"),
        Map.entry("resume-review", "Resume Review"),
        Map.entry("career-guidance", "Career Guidance"),
        Map.entry("company-specific", "Company Specific")
    );

    private static final int PLATFORM_FEE_PERCENT = 5;

    private static final Set<Status> BLOCKING_STATUSES = Set.of(Status.PENDING, Status.ACCEPTED);

    private final MockInterviewerRepository interviewerRepository;
    private final MockInterviewRequestRepository requestRepository;
    private final MockInterviewSessionRepository sessionRepository;
    private final MockInterviewFeedbackRepository feedbackRepository;
    private final MockInterviewFavoriteRepository favoriteRepository;
    private final MentorProfileRepository profileRepository;
    private final MentorApplicationRepository applicationRepository;
    private final MentorApplicationNotificationService notificationService;
    private final MentorAvailabilityService availabilityService;
    private final PaymentVerificationService paymentVerificationService;

    public MockInterviewService(
        MockInterviewerRepository interviewerRepository,
        MockInterviewRequestRepository requestRepository,
        MockInterviewSessionRepository sessionRepository,
        MockInterviewFeedbackRepository feedbackRepository,
        MockInterviewFavoriteRepository favoriteRepository,
        MentorProfileRepository profileRepository,
        MentorApplicationRepository applicationRepository,
        MentorApplicationNotificationService notificationService,
        MentorAvailabilityService availabilityService,
        PaymentVerificationService paymentVerificationService
    ) {
        this.interviewerRepository = interviewerRepository;
        this.requestRepository = requestRepository;
        this.sessionRepository = sessionRepository;
        this.feedbackRepository = feedbackRepository;
        this.favoriteRepository = favoriteRepository;
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
        this.notificationService = notificationService;
        this.availabilityService = availabilityService;
        this.paymentVerificationService = paymentVerificationService;
    }

    @Transactional
    public int syncInterviewersFromProfiles() {
        int synced = 0;
        for (MentorProfile profile : findApprovedMentorProfiles()) {
            MockInterviewer interviewer = interviewerRepository.findByUserId(profile.getUserId())
                .orElseGet(MockInterviewer::new);
            if (interviewer.getId() == null) {
                interviewer.setUserId(profile.getUserId());
            }
            interviewer.setHeadline(firstNonBlank(profile.getFullName(), profile.getHeadline(), "Mock Interviewer"));
            interviewer.setCompany(profile.getCompany());
            interviewer.setExperience(profile.getExperienceRange());
            interviewer.setSkills(profile.getExpertiseTags() != null ? profile.getExpertiseTags() : "Java,DSA");
            interviewer.setRating(profile.getAverageRating() > 0 ? profile.getAverageRating() : 4.5);
            interviewer.setTotalReviews(profile.getRatingCount());
            interviewer.setTotalInterviews(profile.getSessionsCompleted());
            int price = profile.getMockInterviewPriceCents() != null && profile.getMockInterviewPriceCents() > 0
                ? profile.getMockInterviewPriceCents()
                : (profile.getHourlyRateCents() != null ? profile.getHourlyRateCents() : 49900);
            interviewer.setHourlyRateCents(price);
            interviewer.setBio(profile.getBio());
            interviewer.setProfilePicture(profile.getProfileImageUrl());
            interviewer.setOnline(profile.isAvailable());
            interviewer.setStatus(MockInterviewer.STATUS_ACTIVE);
            interviewerRepository.save(interviewer);
            synced++;
        }
        log.info("Synced {} mock interviewers from mentor profiles", synced);
        return synced;
    }

    @Transactional(readOnly = true)
    public MarketplaceStatsResponse getStats() {
        List<MentorApplication> approvedApplications = applicationRepository
            .findAllByStatusOrderByCreatedAtDesc(MentorApplication.Status.APPROVED);
        List<MentorProfile> profiles = findApprovedMentorProfiles();
        long interviews = profiles.stream().mapToLong(MentorProfile::getSessionsCompleted).sum();
        double avgRating = profiles.isEmpty() ? 4.8
            : profiles.stream().mapToDouble(MentorProfile::getAverageRating).filter(r -> r > 0).average().orElse(4.8);
        log.info(
            "Mock interview stats: approvedApplications={} profilesWithData={} totalInterviews={}",
            approvedApplications.size(),
            profiles.size(),
            interviews
        );
        return new MarketplaceStatsResponse(
            approvedApplications.size(),
            Math.max(interviews, requestRepository.count()),
            Math.round(avgRating * 10.0) / 10.0,
            98.0
        );
    }

    @Transactional(readOnly = true)
    public List<CategoryCountResponse> getCategories() {
        List<MentorApplication> approvedApplications = applicationRepository
            .findAllByStatusOrderByCreatedAtDesc(MentorApplication.Status.APPROVED);
        List<CategoryCountResponse> result = new ArrayList<>();
        for (var cat : CATEGORIES) {
            List<MentorProfile> matching = approvedApplications.stream()
                .map(app -> profileRepository.findById(app.getUserId()).orElse(null))
                .filter(profile -> profile == null || isVisibleInMarketplace(profile))
                .filter(profile -> matchesCategory(
                    profile != null ? profileSkills(profile) : "Java,DSA,Algorithms",
                    cat.getKey()
                ))
                .toList();
            long count = matching.size();
            double avgRating = matching.isEmpty() ? 4.8
                : matching.stream().mapToDouble(MentorProfile::getAverageRating).filter(r -> r > 0).average().orElse(4.8);
            result.add(new CategoryCountResponse(cat.getKey(), cat.getValue(), count, Math.round(avgRating * 10.0) / 10.0));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<InterviewerCardResponse> listInterviewers(
        UUID learnerId,
        String search,
        String category,
        boolean onlineOnly,
        Double minRating,
        Integer minPrice,
        Integer maxPrice
    ) {
        List<MentorApplication> approvedApplications = applicationRepository
            .findAllByStatusOrderByCreatedAtDesc(MentorApplication.Status.APPROVED);
        log.info(
            "Mock interview marketplace load: totalApprovedMentorsFound={} search={} category={} onlineOnly={} minRating={}",
            approvedApplications.size(), search, category, onlineOnly, minRating
        );

        Set<UUID> favorites = learnerId == null
            ? Set.of()
            : favoriteRepository.listByLearnerId(learnerId).stream()
                .map(MockInterviewFavorite::getInterviewerUserId)
                .collect(Collectors.toSet());

        String normalizedSearch = trim(search);
        String categoryFilter = mapCategoryFilter(category);

        List<InterviewerCardResponse> result = approvedApplications.stream()
            .map(app -> {
                MentorProfile profile = profileRepository.findById(app.getUserId()).orElse(null);
                if (profile != null && !isVisibleInMarketplace(profile)) {
                    return null;
                }
                return toCardFromApproved(app, profile, favorites.contains(app.getUserId()), learnerId);
            })
            .filter(Objects::nonNull)
            .filter(card -> !onlineOnly || card.online())
            .filter(card -> minRating == null || card.rating() >= minRating)
            .filter(card -> matchesPrice(card.pricePerInterviewCents(), minPrice, maxPrice))
            .filter(card -> matchesSearchCard(card, normalizedSearch))
            .filter(card -> categoryFilter.isBlank() || matchesCategory(String.join(",", card.skills()), categoryFilter))
            .sorted((a, b) -> Double.compare(b.rating(), a.rating()))
            .toList();

        log.info("Mock interview marketplace load: interviewersReturned={}", result.size());
        return result;
    }

    @Transactional(readOnly = true)
    public InterviewerDetailResponse getInterviewer(UUID interviewerUserId, UUID learnerId) {
        MentorApplication application = applicationRepository.findByUserId(interviewerUserId)
            .filter(app -> app.getStatus() == MentorApplication.Status.APPROVED)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interviewer not found"));
        MentorProfile profile = profileRepository.findById(interviewerUserId).orElse(null);
        if (profile != null && !isVisibleInMarketplace(profile)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Interviewer not available");
        }
        boolean favorited = learnerId != null
            && favoriteRepository.findByLearnerAndInterviewer(learnerId, interviewerUserId).isPresent();
        String requestStatus = resolveRequestStatus(learnerId, interviewerUserId);

        List<ReviewSnippetResponse> reviews = feedbackRepository
            .findByInterviewerIdOrderByCreatedAtDesc(interviewerUserId)
            .stream()
            .limit(5)
            .map(f -> new ReviewSnippetResponse(
                "Learner",
                f.getOverallRating(),
                firstNonBlank(f.getStrengths(), "Great session"),
                f.getCreatedAt().toString()
            ))
            .toList();

        if (profile == null) {
            int priceCents = application.getHourlyRateCents() != null ? application.getHourlyRateCents() : 0;
            return new InterviewerDetailResponse(
                application.getUserId(),
                application.getUserId(),
                firstNonBlank(application.getUsername(), application.getHeadline(), "Interviewer"),
                firstNonBlank(application.getHeadline(), "Mock Interviewer"),
                null,
                null,
                null,
                parseSkills("Java,DSA,Algorithms"),
                application.getBio(),
                4.5,
                0,
                0,
                priceCents,
                formatPrice(priceCents),
                null,
                true,
                favorited,
                requestStatus,
                reviews
            );
        }

        String name = displayName(profile);
        int priceCents = resolveInterviewPriceCents(profile);

        return new InterviewerDetailResponse(
            profile.getUserId(),
            profile.getUserId(),
            name,
            firstNonBlank(profile.getHeadline(), profile.getDesignation(), "Mock Interviewer"),
            profile.getCompany(),
            profile.getDesignation(),
            profile.getExperienceRange(),
            parseSkills(profileSkills(profile)),
            profile.getBio(),
            profile.getAverageRating() > 0 ? profile.getAverageRating() : 4.5,
            profile.getRatingCount(),
            profile.getSessionsCompleted(),
            priceCents,
            formatPrice(priceCents),
            profile.getProfileImageUrl(),
            profile.isAvailable(),
            favorited,
            requestStatus,
            reviews
        );
    }

    @Transactional
    public MockInterviewRequestResponse createRequest(UUID learnerId, String learnerName, CreateRequestBody body) {
        requireApprovedMentor(body.interviewerId());

        if (requestRepository.hasLearnerInterviewerRequestInStatuses(
            learnerId, body.interviewerId(), BLOCKING_STATUSES
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending or accepted request with this interviewer");
        }

        MockInterviewRequest request = new MockInterviewRequest();
        request.setLearnerId(learnerId);
        request.setLearnerName(learnerName != null ? learnerName : "Learner");
        request.setInterviewerId(body.interviewerId());
        request.setInterviewType(trim(body.interviewType()));
        request.setDifficulty(trim(body.difficulty()));
        request.setFocusTopic(trim(body.focusTopic()));
        request.setMessage(body.message());
        request.setStatus(Status.PENDING);
        request.setScheduledAt(parseInstant(body.preferredDate()));
        MockInterviewRequest saved = requestRepository.save(request);

        log.info("Mock interview request created learnerId={} interviewerId={} requestStatus=PENDING", learnerId, body.interviewerId());

        notificationService.notifyUser(
            body.interviewerId(),
            "New mock interview request",
            learnerName + " requested a mock interview: " + body.interviewType(),
            "mock_interview_request"
        );

        return toMockInterviewRequestResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(
        UUID interviewerId,
        Instant from,
        Instant to,
        int durationMinutes
    ) {
        requireApprovedMentor(interviewerId);
        return availabilityService.getBookableSlots(interviewerId, from, to, durationMinutes);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlotsByLocalDates(
        UUID interviewerId,
        java.time.LocalDate fromDate,
        java.time.LocalDate toDate,
        int durationMinutes
    ) {
        requireApprovedMentor(interviewerId);
        return availabilityService.getBookableSlotsByLocalDates(interviewerId, fromDate, toDate, durationMinutes);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlotsForDate(
        UUID interviewerId,
        java.time.LocalDate date,
        int durationMinutes
    ) {
        requireApprovedMentor(interviewerId);
        return availabilityService.getAvailableSlotsForDate(interviewerId, date, durationMinutes);
    }

    @Transactional(readOnly = true)
    public BookingSummaryResponse computeBookingSummary(UUID interviewerId, int durationMinutes) {
        MentorProfile profile = requireApprovedMentor(interviewerId);
        int basePrice = resolveInterviewPriceCents(profile);
        if (basePrice <= 0) {
            basePrice = 49900;
        }
        int price = scalePriceForDuration(basePrice, durationMinutes);
        int platformFee = Math.max(100, price * PLATFORM_FEE_PERCENT / 100);
        return new BookingSummaryResponse(price, platformFee, price + platformFee, "INR");
    }

    @Transactional
    public MockInterviewRequestResponse bookInterview(UUID learnerId, String learnerName, BookInterviewBody body) {
        MentorProfile profile = requireApprovedMentor(body.interviewerId());
        if (profile.isVacationMode() || !profile.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mentor is not accepting bookings right now");
        }
        Instant scheduledAt = parseInstant(body.scheduledAt());
        if (scheduledAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scheduled time is required");
        }
        int duration = body.durationMinutes() > 0 ? body.durationMinutes() : 30;
        Instant slotEnd = scheduledAt.plus(duration, ChronoUnit.MINUTES);

        if (requestRepository.hasInterviewerBookingBetween(
            body.interviewerId(), scheduledAt, slotEnd, BLOCKING_STATUSES
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This slot was just booked by someone else");
        }
        availabilityService.assertSlotAvailable(body.interviewerId(), scheduledAt, slotEnd);

        BookingSummaryResponse summary = computeBookingSummary(body.interviewerId(), duration);
        paymentVerificationService.verifyCompletedPurchase(
            learnerId, body.paymentId(), summary.totalCents(), summary.currency()
        );

        boolean autoSchedule = profile.isAutoSchedulingEnabled();
        Status bookingStatus = autoSchedule ? Status.ACCEPTED : Status.PENDING;

        MockInterviewRequest request = new MockInterviewRequest();
        request.setLearnerId(learnerId);
        request.setLearnerName(learnerName != null ? learnerName : "Learner");
        request.setInterviewerId(body.interviewerId());
        request.setInterviewType(trim(body.interviewType()));
        request.setDifficulty("Intermediate");
        request.setFocusTopic(trim(body.interviewType()));
        request.setMessage(body.message());
        request.setStatus(bookingStatus);
        request.setScheduledAt(scheduledAt);
        request.setSlotEndAt(slotEnd);
        request.setDurationMinutes(duration);
        request.setPaymentId(body.paymentId());
        request.setAmountCents(summary.interviewPriceCents());
        request.setPlatformFeeCents(summary.platformFeeCents());
        request.setPaymentStatus("PAID");
        MockInterviewRequest saved = requestRepository.save(request);

        MockInterviewSession session = null;
        if (autoSchedule) {
            session = new MockInterviewSession();
            session.setRequestId(saved.getId());
            session.setStatus(MockInterviewSession.STATUS_WAITING);
            sessionRepository.save(session);
        }

        log.info(
            "Mock interview booked learnerId={} interviewerId={} scheduledAt={} paymentId={} autoSchedule={}",
            learnerId, body.interviewerId(), scheduledAt, body.paymentId(), autoSchedule
        );

        notificationService.notifyUser(
            body.interviewerId(),
            autoSchedule ? "New mock interview booking" : "Mock interview booking request",
            learnerName + (autoSchedule ? " booked" : " requested") + " a mock interview: " + body.interviewType(),
            autoSchedule ? "mock_interview_booked" : "mock_interview_request"
        );
        notificationService.notifyUser(
            learnerId,
            autoSchedule ? "Mock interview confirmed" : "Mock interview request sent",
            autoSchedule
                ? "Your interview is scheduled. Session code: " + (session != null ? session.getSessionCode() : "")
                : "Your booking request was sent. The mentor will confirm shortly.",
            autoSchedule ? "mock_interview_confirmed" : "mock_interview_pending"
        );

        return toMockInterviewRequestResponse(saved);
    }

    private int scalePriceForDuration(int basePriceCents, int durationMinutes) {
        if (durationMinutes <= 30) {
            return basePriceCents;
        }
        if (durationMinutes <= 45) {
            return (int) Math.round(basePriceCents * 1.25);
        }
        if (durationMinutes <= 60) {
            return basePriceCents * 2;
        }
        return (int) Math.round(basePriceCents * 2.5);
    }

    @Transactional(readOnly = true)
    public List<MockInterviewRequestResponse> listMyRequests(UUID learnerId, String statusFilter) {
        List<MockInterviewRequest> requests = statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)
            ? requestRepository.findByLearnerIdOrderByCreatedAtDesc(learnerId)
            : requestRepository.findByLearnerIdAndStatusOrderByCreatedAtDesc(learnerId, Status.valueOf(statusFilter.toUpperCase()));
        return requests.stream().map(this::toMockInterviewRequestResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MockInterviewRequestResponse> listIncomingRequests(UUID interviewerId) {
        return requestRepository.findByInterviewerIdAndStatusOrderByCreatedAtDesc(interviewerId, Status.PENDING)
            .stream().map(this::toMockInterviewRequestResponse).toList();
    }

    @Transactional
    public MockInterviewRequestResponse acceptRequest(UUID interviewerId, UUID requestId) {
        MockInterviewRequest request = requirePendingForInterviewer(interviewerId, requestId);
        request.setStatus(Status.ACCEPTED);
        requestRepository.save(request);

        MockInterviewSession session = new MockInterviewSession();
        session.setRequestId(request.getId());
        session.setStatus(MockInterviewSession.STATUS_WAITING);
        MockInterviewSession savedSession = sessionRepository.save(session);

        log.info("Mock interview accepted requestId={} sessionCode={} relationshipCreated=true",
            requestId, savedSession.getSessionCode());

        notificationService.notifyUser(
            request.getLearnerId(),
            "Mock interview accepted",
            "Your mock interview request has been accepted. Session code: " + savedSession.getSessionCode(),
            "mock_interview_accepted"
        );

        return toMockInterviewRequestResponse(request);
    }

    @Transactional
    public MockInterviewRequestResponse rejectRequest(UUID interviewerId, UUID requestId) {
        MockInterviewRequest request = requirePendingForInterviewer(interviewerId, requestId);
        request.setStatus(Status.REJECTED);
        requestRepository.save(request);

        notificationService.notifyUser(
            request.getLearnerId(),
            "Mock interview declined",
            "Your mock interview request was declined.",
            "mock_interview_rejected"
        );

        return toMockInterviewRequestResponse(request);
    }

    @Transactional
    public MockInterviewRequestResponse cancelRequest(UUID learnerId, UUID requestId) {
        MockInterviewRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!request.getLearnerId().equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your request");
        }
        if (request.getStatus() != Status.PENDING && request.getStatus() != Status.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking cannot be cancelled");
        }
        if (request.getStatus() == Status.ACCEPTED && request.getScheduledAt() != null
            && request.getScheduledAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Past interviews cannot be cancelled");
        }
        request.setStatus(Status.REJECTED);
        requestRepository.save(request);
        return toMockInterviewRequestResponse(request);
    }

    @Transactional
    public MockInterviewSessionResponse startSession(UUID userId, String sessionCode) {
        MockInterviewSession session = sessionRepository.findBySessionCodeIgnoreCase(sessionCode.trim().toUpperCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        MockInterviewRequest request = requestRepository.findById(session.getRequestId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        assertParticipant(userId, request);

        if (request.getStatus() != Status.ACCEPTED && request.getStatus() != Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Interview must be accepted before joining");
        }

        session.setStatus(MockInterviewSession.STATUS_LIVE);
        session.setStartedAt(Instant.now());
        sessionRepository.save(session);

        return toMockInterviewSessionResponse(session, request);
    }

    @Transactional
    public MockInterviewSessionResponse endSession(UUID userId, UUID sessionId) {
        MockInterviewSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        MockInterviewRequest request = requestRepository.findById(session.getRequestId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        assertParticipant(userId, request);

        session.setStatus(MockInterviewSession.STATUS_COMPLETED);
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);

        request.setStatus(Status.COMPLETED);
        requestRepository.save(request);

        interviewerRepository.findByUserId(request.getInterviewerId()).ifPresent(interviewer -> {
            interviewer.setTotalInterviews(interviewer.getTotalInterviews() + 1);
            interviewerRepository.save(interviewer);
        });
        profileRepository.findById(request.getInterviewerId()).ifPresent(profile -> {
            profile.setSessionsCompleted(profile.getSessionsCompleted() + 1);
            profileRepository.save(profile);
        });

        notificationService.notifyUser(request.getLearnerId(), "Interview completed", "Your mock interview session has ended.", "mock_interview_completed");
        notificationService.notifyUser(request.getInterviewerId(), "Interview completed", "Mock interview session completed.", "mock_interview_completed");

        return toMockInterviewSessionResponse(session, request);
    }

    @Transactional
    public FeedbackResponse submitFeedback(UUID interviewerId, SubmitFeedbackBody body) {
        MockInterviewSession session = sessionRepository.findById(body.sessionId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        MockInterviewRequest request = requestRepository.findById(session.getRequestId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (!request.getInterviewerId().equals(interviewerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the interviewer can submit feedback");
        }

        if (feedbackRepository.findBySessionId(session.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Feedback already submitted");
        }

        MockInterviewFeedback feedback = new MockInterviewFeedback();
        feedback.setSessionId(session.getId());
        feedback.setLearnerId(request.getLearnerId());
        feedback.setInterviewerId(interviewerId);
        feedback.setTechnicalScore(clamp(body.technicalScore()));
        feedback.setCommunicationScore(clamp(body.communicationScore()));
        feedback.setProblemSolvingScore(clamp(body.problemSolvingScore()));
        feedback.setSystemDesignScore(clamp(body.systemDesignScore()));
        feedback.setStrengths(body.strengths());
        feedback.setWeaknesses(body.weaknesses());
        feedback.setRecommendations(body.recommendations());
        feedback.setOverallRating(body.overallRating());
        MockInterviewFeedback saved = feedbackRepository.save(feedback);

        notificationService.notifyUser(
            request.getLearnerId(),
            "Interview feedback submitted",
            "Your interviewer submitted feedback for your mock interview.",
            "mock_interview_feedback"
        );

        return toFeedbackResponse(saved);
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedback(UUID sessionId, UUID userId) {
        MockInterviewFeedback feedback = feedbackRepository.findBySessionId(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found"));
        if (!feedback.getLearnerId().equals(userId) && !feedback.getInterviewerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return toFeedbackResponse(feedback);
    }

    @Transactional(readOnly = true)
    public UpcomingInterviewResponse getUpcoming(UUID learnerId) {
        Instant now = Instant.now();
        return requestRepository.findByLearnerIdOrderByCreatedAtDesc(learnerId).stream()
            .filter(r -> r.getStatus() == Status.ACCEPTED && r.getScheduledAt() != null)
            .filter(r -> r.getSlotEndAt() == null || r.getSlotEndAt().isAfter(now))
            .sorted(Comparator.comparing(MockInterviewRequest::getScheduledAt))
            .findFirst()
            .map(r -> {
                String sessionCode = sessionRepository.findByRequestId(r.getId())
                    .map(MockInterviewSession::getSessionCode).orElse(null);
                UUID sessionId = sessionRepository.findByRequestId(r.getId())
                    .map(MockInterviewSession::getId).orElse(null);
                MockInterviewer interviewer = interviewerRepository.findByUserId(r.getInterviewerId()).orElse(null);
                MentorProfile profile = profileRepository.findById(r.getInterviewerId()).orElse(null);
                String name = profile != null ? displayName(profile)
                    : interviewer != null ? interviewer.getHeadline() : "Interviewer";
                String picture = profile != null ? profile.getProfileImageUrl()
                    : interviewer != null ? interviewer.getProfilePicture() : null;
                Instant scheduled = r.getScheduledAt();
                boolean canJoin = sessionCode != null
                    && !now.isBefore(scheduled.minus(15, ChronoUnit.MINUTES));
                String joinMessage = canJoin
                    ? "Your interview room is ready"
                    : formatUntilInterview(now, scheduled);
                return new UpcomingInterviewResponse(
                    r.getId(),
                    sessionId,
                    sessionCode,
                    r.getInterviewerId(),
                    name,
                    picture,
                    r.getInterviewType(),
                    scheduled.toString(),
                    r.getStatus().name(),
                    canJoin,
                    joinMessage
                );
            })
            .orElse(null);
    }

    private String formatUntilInterview(Instant now, Instant scheduled) {
        long hours = ChronoUnit.HOURS.between(now, scheduled);
        if (hours >= 48) {
            return "Interview starts in " + (hours / 24) + " days";
        }
        if (hours >= 1) {
            return "Interview starts in " + hours + " hours";
        }
        long minutes = Math.max(1, ChronoUnit.MINUTES.between(now, scheduled));
        return "Interview starts in " + minutes + " minutes";
    }

    @Transactional
    public boolean toggleFavorite(UUID learnerId, UUID interviewerUserId) {
        requireApprovedMentor(interviewerUserId);
        var existing = favoriteRepository.findByLearnerAndInterviewer(learnerId, interviewerUserId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        }
        MockInterviewFavorite favorite = new MockInterviewFavorite();
        favorite.setLearnerId(learnerId);
        favorite.setInterviewerUserId(interviewerUserId);
        favoriteRepository.save(favorite);
        return true;
    }

    @Transactional(readOnly = true)
    public MockInterviewSessionResponse getSessionByCode(String code, UUID userId) {
        MockInterviewSession session = sessionRepository.findBySessionCodeIgnoreCase(code.trim().toUpperCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        MockInterviewRequest request = requestRepository.findById(session.getRequestId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        assertParticipant(userId, request);
        return toMockInterviewSessionResponse(session, request);
    }

    private MockInterviewRequest requirePendingForInterviewer(UUID interviewerId, UUID requestId) {
        MockInterviewRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!request.getInterviewerId().equals(interviewerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your request");
        }
        if (request.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        return request;
    }

    private void assertParticipant(UUID userId, MockInterviewRequest request) {
        if (!request.getLearnerId().equals(userId) && !request.getInterviewerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant");
        }
    }

    private List<MentorProfile> findApprovedMentorProfiles() {
        List<MentorApplication> approvedApplications = applicationRepository
            .findAllByStatusOrderByCreatedAtDesc(MentorApplication.Status.APPROVED);
        log.info("Total approved mentor applications found: {}", approvedApplications.size());

        LinkedHashSet<UUID> approvedUserIds = approvedApplications.stream()
            .map(MentorApplication::getUserId)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<MentorProfile> profiles = approvedUserIds.stream()
            .map(userId -> profileRepository.findById(userId).orElse(null))
            .filter(Objects::nonNull)
            .filter(this::isVisibleInMarketplace)
            .toList();

        if (profiles.size() < approvedUserIds.size()) {
            log.warn(
                "Some approved mentors have no mentor profile yet: approvedApplications={} profilesFound={}",
                approvedUserIds.size(),
                profiles.size()
            );
        }

        log.info("Approved mentors visible in mock interview marketplace: {}", profiles.size());
        return profiles;
    }

    private boolean isVisibleInMarketplace(MentorProfile profile) {
        if (profile.isVacationMode() || !profile.isAvailable()) {
            return false;
        }
        String adminStatus = profile.getAdminStatus();
        if (adminStatus == null || adminStatus.isBlank()) {
            return true;
        }
        return !"BLOCKED".equalsIgnoreCase(adminStatus) && !"SUSPENDED".equalsIgnoreCase(adminStatus);
    }

    private MentorProfile requireApprovedMentor(UUID userId) {
        MentorApplication application = applicationRepository.findByUserId(userId)
            .filter(app -> app.getStatus() == MentorApplication.Status.APPROVED)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interviewer is not an approved mentor"));
        MentorProfile profile = profileRepository.findById(userId).orElse(null);
        if (profile != null && !isVisibleInMarketplace(profile)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Interviewer not available");
        }
        if (profile == null) {
            profile = new MentorProfile();
            profile.setUserId(application.getUserId());
            profile.setHeadline(application.getHeadline());
            profile.setBio(application.getBio());
            profile.setHourlyRateCents(application.getHourlyRateCents());
            profile.setAvailable(true);
        }
        return profile;
    }

    private InterviewerCardResponse toCardFromApproved(
        MentorApplication application,
        MentorProfile profile,
        boolean favorited,
        UUID learnerId
    ) {
        if (profile != null) {
            return toCardFromProfile(profile, favorited, learnerId);
        }
        int priceCents = application.getHourlyRateCents() != null && application.getHourlyRateCents() > 0
            ? application.getHourlyRateCents()
            : 0;
        String skillsRaw = "Java,DSA,Algorithms";
        return new InterviewerCardResponse(
            application.getUserId(),
            application.getUserId(),
            firstNonBlank(application.getUsername(), application.getHeadline(), "Interviewer"),
            firstNonBlank(application.getHeadline(), "Mock Interviewer"),
            null,
            null,
            parseSkills(skillsRaw),
            4.5,
            0,
            0,
            priceCents,
            formatPrice(priceCents),
            null,
            true,
            favorited,
            resolveRequestStatus(learnerId, application.getUserId())
        );
    }

    private boolean matchesSearchCard(InterviewerCardResponse card, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String haystack = (
            card.name() + " "
                + nullToEmpty(card.headline()) + " "
                + nullToEmpty(card.company()) + " "
                + String.join(",", card.skills())
        ).toLowerCase();
        return haystack.contains(search.toLowerCase());
    }

    private boolean matchesPrice(int priceCents, Integer minPrice, Integer maxPrice) {
        if (priceCents <= 0) {
            return minPrice == null && maxPrice == null;
        }
        if (minPrice != null && priceCents < minPrice) {
            return false;
        }
        if (maxPrice != null && priceCents > maxPrice) {
            return false;
        }
        return true;
    }

    private InterviewerCardResponse toCardFromProfile(MentorProfile profile, boolean favorited, UUID learnerId) {
        int priceCents = resolveInterviewPriceCents(profile);
        return new InterviewerCardResponse(
            profile.getUserId(),
            profile.getUserId(),
            displayName(profile),
            firstNonBlank(profile.getHeadline(), profile.getDesignation(), "Mock Interviewer"),
            profile.getCompany(),
            profile.getExperienceRange(),
            parseSkills(profileSkills(profile)),
            profile.getAverageRating() > 0 ? profile.getAverageRating() : 4.5,
            profile.getRatingCount(),
            profile.getSessionsCompleted(),
            priceCents,
            formatPrice(priceCents),
            profile.getProfileImageUrl(),
            profile.isAvailable(),
            favorited,
            resolveRequestStatus(learnerId, profile.getUserId())
        );
    }

    private String displayName(MentorProfile profile) {
        return firstNonBlank(profile.getFullName(), profile.getHeadline(), profile.getDesignation(), "Interviewer");
    }

    private String profileSkills(MentorProfile profile) {
        if (profile.getExpertiseTags() != null && !profile.getExpertiseTags().isBlank()) {
            return profile.getExpertiseTags();
        }
        return "Java,DSA,Algorithms";
    }

    private int resolveInterviewPriceCents(MentorProfile profile) {
        if (profile.getMockInterviewPriceCents() != null && profile.getMockInterviewPriceCents() > 0) {
            return profile.getMockInterviewPriceCents();
        }
        if (profile.getHourlyRateCents() != null && profile.getHourlyRateCents() > 0) {
            return profile.getHourlyRateCents();
        }
        return 0;
    }

    private String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    private String resolveRequestStatus(UUID learnerId, UUID interviewerUserId) {
        if (learnerId == null) {
            return "NONE";
        }
        return requestRepository
            .loadBlockingRequestsForPair(learnerId, interviewerUserId, BLOCKING_STATUSES, org.springframework.data.domain.Pageable.ofSize(1))
            .stream()
            .findFirst()
            .map(r -> r.getStatus().name())
            .orElse("NONE");
    }

    private MockInterviewRequestResponse toMockInterviewRequestResponse(MockInterviewRequest request) {
        MockInterviewer interviewer = interviewerRepository.findByUserId(request.getInterviewerId()).orElse(null);
        MentorProfile profile = profileRepository.findById(request.getInterviewerId()).orElse(null);
        String interviewerName = profile != null ? displayName(profile)
            : interviewer != null ? interviewer.getHeadline() : "Interviewer";
        String picture = profile != null ? profile.getProfileImageUrl()
            : interviewer != null ? interviewer.getProfilePicture() : null;
        String sessionCode = sessionRepository.findByRequestId(request.getId())
            .map(MockInterviewSession::getSessionCode).orElse(null);

        return new MockInterviewRequestResponse(
            request.getId(),
            request.getLearnerId(),
            request.getLearnerName(),
            request.getInterviewerId(),
            interviewerName,
            picture,
            request.getInterviewType(),
            request.getDifficulty(),
            request.getFocusTopic(),
            request.getMessage(),
            request.getStatus().name(),
            request.getScheduledAt() != null ? request.getScheduledAt().toString() : null,
            request.getSlotEndAt() != null ? request.getSlotEndAt().toString() : null,
            request.getDurationMinutes(),
            request.getAmountCents(),
            request.getPlatformFeeCents(),
            request.getPaymentStatus(),
            sessionCode,
            request.getCreatedAt().toString(),
            request.getUpdatedAt().toString()
        );
    }

    private MockInterviewSessionResponse toMockInterviewSessionResponse(MockInterviewSession session, MockInterviewRequest request) {
        return new MockInterviewSessionResponse(
            session.getId(),
            session.getRequestId(),
            session.getSessionCode(),
            session.getRoomId(),
            session.getStatus(),
            session.getStartedAt() != null ? session.getStartedAt().toString() : null,
            session.getEndedAt() != null ? session.getEndedAt().toString() : null,
            toMockInterviewRequestResponse(request)
        );
    }

    private FeedbackResponse toFeedbackResponse(MockInterviewFeedback feedback) {
        MentorProfile profile = profileRepository.findById(feedback.getInterviewerId()).orElse(null);
        String name = profile != null ? firstNonBlank(profile.getFullName(), profile.getHeadline(), "Interviewer") : "Interviewer";
        return new FeedbackResponse(
            feedback.getId(),
            feedback.getSessionId(),
            feedback.getLearnerId(),
            feedback.getInterviewerId(),
            name,
            feedback.getTechnicalScore(),
            feedback.getCommunicationScore(),
            feedback.getProblemSolvingScore(),
            feedback.getSystemDesignScore(),
            feedback.getStrengths(),
            feedback.getWeaknesses(),
            feedback.getRecommendations(),
            feedback.getOverallRating(),
            feedback.getCreatedAt().toString()
        );
    }

    private boolean matchesCategory(String skills, String categoryKey) {
        if (skills == null) return false;
        String lower = skills.toLowerCase();
        return switch (categoryKey) {
            case "dsa" -> lower.contains("dsa") || lower.contains("algorithm") || lower.contains("java");
            case "system-design" -> lower.contains("system") || lower.contains("design");
            case "backend" -> lower.contains("backend") || lower.contains("api") || lower.contains("spring");
            case "frontend" -> lower.contains("frontend") || lower.contains("react") || lower.contains("javascript");
            case "behavioral" -> lower.contains("behavior") || lower.contains("leadership");
            case "resume-review" -> lower.contains("resume") || lower.contains("cv");
            case "career-guidance" -> lower.contains("career") || lower.contains("guidance") || lower.contains("mentor");
            case "company-specific" -> lower.contains("faang") || lower.contains("amazon") || lower.contains("google") || lower.contains("company");
            default -> true;
        };
    }

    private String mapCategoryFilter(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) return "";
        return switch (category.toLowerCase()) {
            case "dsa" -> "dsa";
            case "system-design" -> "system";
            case "backend" -> "backend";
            case "frontend" -> "frontend";
            case "behavioral" -> "behavior";
            case "resume-review" -> "resume";
            case "career-guidance" -> "career";
            case "company-specific" -> "company";
            default -> category;
        };
    }

    private List<String> parseSkills(String skills) {
        if (skills == null || skills.isBlank()) return List.of();
        return Arrays.stream(skills.split("[,;|]"))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .limit(8)
            .toList();
    }

    private String formatPrice(int cents) {
        if (cents <= 0) {
            return "Contact for pricing";
        }
        return "₹" + (cents / 100) + " / interview";
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private int clamp(int score) {
        return Math.max(1, Math.min(10, score));
    }

    private String trim(String value) {
        return value != null ? value.trim() : "";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return "";
    }
}
