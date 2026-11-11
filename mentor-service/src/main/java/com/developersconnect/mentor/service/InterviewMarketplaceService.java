package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateInterviewQuestionSetRequest;
import com.developersconnect.mentor.dto.UpdateInterviewQuestionSetRequest;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.*;
import com.developersconnect.mentor.model.InterviewAssignmentSubmission;
import com.developersconnect.mentor.model.InterviewMentorFeedback;
import com.developersconnect.mentor.model.InterviewPackReview;
import com.developersconnect.mentor.model.InterviewQuestionAssignment;
import com.developersconnect.mentor.model.InterviewQuestionSet;
import com.developersconnect.mentor.model.InterviewQuestionSetItem;
import com.developersconnect.mentor.model.InterviewQuestionSetPurchase;
import com.developersconnect.mentor.model.MentorInterviewQuestion;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.InterviewAssignmentSubmissionRepository;
import com.developersconnect.mentor.repository.InterviewMentorFeedbackRepository;
import com.developersconnect.mentor.repository.InterviewPackReviewRepository;
import com.developersconnect.mentor.repository.InterviewQuestionAssignmentRepository;
import com.developersconnect.mentor.repository.InterviewQuestionSetItemRepository;
import com.developersconnect.mentor.repository.InterviewQuestionSetPurchaseRepository;
import com.developersconnect.mentor.repository.InterviewQuestionSetRepository;
import com.developersconnect.mentor.repository.MentorInterviewQuestionRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InterviewMarketplaceService {

    private static final Logger log = LoggerFactory.getLogger(InterviewMarketplaceService.class);

    private static final String PUBLISHED = "PUBLISHED";
    private static final String DRAFT = "DRAFT";
    private static final List<String> MARKETPLACE_VISIBILITIES = List.of("PUBLIC_FREE", "PUBLIC_PAID");
    private static final String COMPLETED = "COMPLETED";
    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US).withZone(ZoneId.systemDefault());

    private static final Map<String, String> DIFFICULTY_LABELS = Map.of(
        "easy", "Easy", "medium", "Medium", "hard", "Hard", "expert", "Expert"
    );

    private static final Map<String, String> STATUS_LABELS = Map.of(
        "PENDING", "Pending",
        "IN_PROGRESS", "In Progress",
        "SUBMITTED", "Submitted",
        "UNDER_REVIEW", "Under Review",
        "REVIEWED", "Reviewed",
        "COMPLETED", "Completed"
    );

    private final InterviewQuestionSetRepository setRepository;
    private final InterviewQuestionSetItemRepository itemRepository;
    private final InterviewQuestionAssignmentRepository assignmentRepository;
    private final InterviewAssignmentSubmissionRepository submissionRepository;
    private final InterviewMentorFeedbackRepository feedbackRepository;
    private final InterviewQuestionSetPurchaseRepository purchaseRepository;
    private final InterviewPackReviewRepository reviewRepository;
    private final MentorInterviewQuestionRepository questionRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorProfileService mentorProfileService;
    private final PaymentVerificationService paymentVerificationService;
    private final ContentNotificationService contentNotificationService;

    public InterviewMarketplaceService(
        InterviewQuestionSetRepository setRepository,
        InterviewQuestionSetItemRepository itemRepository,
        InterviewQuestionAssignmentRepository assignmentRepository,
        InterviewAssignmentSubmissionRepository submissionRepository,
        InterviewMentorFeedbackRepository feedbackRepository,
        InterviewQuestionSetPurchaseRepository purchaseRepository,
        InterviewPackReviewRepository reviewRepository,
        MentorInterviewQuestionRepository questionRepository,
        MentorProfileRepository mentorProfileRepository,
        MentorProfileService mentorProfileService,
        PaymentVerificationService paymentVerificationService,
        ContentNotificationService contentNotificationService
    ) {
        this.setRepository = setRepository;
        this.itemRepository = itemRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.feedbackRepository = feedbackRepository;
        this.purchaseRepository = purchaseRepository;
        this.reviewRepository = reviewRepository;
        this.questionRepository = questionRepository;
        this.mentorProfileRepository = mentorProfileRepository;
        this.mentorProfileService = mentorProfileService;
        this.paymentVerificationService = paymentVerificationService;
        this.contentNotificationService = contentNotificationService;
    }

    // ── Marketplace browse ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InterviewPageResponse<InterviewPackCardResponse> browseMarketplace(
        UUID learnerId,
        String search,
        String category,
        String difficulty,
        UUID mentorId,
        Integer minPrice,
        Integer maxPrice,
        Double minRating,
        int page,
        int size
    ) {
        List<InterviewQuestionSet> allPublished = setRepository
            .findByDeletedAtIsNullAndStatusAndVisibilityInOrderByPublishedAtDesc(
                PUBLISHED,
                MARKETPLACE_VISIBILITIES
            );

        String normalizedSearch = blankToNull(search);
        String normalizedCategory = blankToNull(category);
        String normalizedDifficulty = normalizeDifficulty(difficulty);

        List<InterviewQuestionSet> filtered = allPublished.stream()
            .filter(set -> normalizedDifficulty == null || normalizedDifficulty.equals(set.getDifficulty()))
            .filter(set -> mentorId == null || mentorId.equals(set.getMentorId()))
            .filter(set -> minPrice == null || set.getPriceCents() >= minPrice)
            .filter(set -> maxPrice == null || set.getPriceCents() <= maxPrice)
            .filter(set -> minRating == null || set.getAvgRating().doubleValue() >= minRating)
            .filter(set -> normalizedCategory == null || containsTag(set.getTags(), normalizedCategory))
            .filter(set -> normalizedSearch == null || matchesSearch(set, normalizedSearch))
            .toList();

        log.info(
            "Marketplace browse: {} published public packs in DB, {} after filters (learner={})",
            allPublished.size(),
            filtered.size(),
            learnerId
        );

        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<InterviewPackCardResponse> items = filtered.subList(from, to).stream()
            .map(s -> toCard(s, learnerId))
            .toList();
        return new InterviewPageResponse<>(items, page, size, filtered.size(), to < filtered.size());
    }

    @Transactional(readOnly = true)
    public InterviewPackDetailResponse getPackDetail(UUID packId, UUID learnerId, boolean previewOnly) {
        InterviewQuestionSet set = requirePublishedPack(packId);
        boolean hasAccess = learnerId != null && hasPackAccess(learnerId, set);
        boolean preview = previewOnly || !hasAccess;
        return toDetail(set, learnerId, preview, hasAccess);
    }

    @Transactional
    public InterviewPackCardResponse purchasePack(UUID learnerId, UUID packId, UUID paymentId) {
        InterviewQuestionSet set = requirePublishedPack(packId);
        if (!"PUBLIC_PAID".equals(set.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pack is not for sale");
        }
        if (hasPackAccess(learnerId, set)) {
            return toCard(set, learnerId);
        }
        paymentVerificationService.verifyCompletedPurchase(
            learnerId, paymentId, set.getPriceCents(), set.getCurrency()
        );
        InterviewQuestionSetPurchase purchase = new InterviewQuestionSetPurchase();
        purchase.setQuestionSetId(packId);
        purchase.setLearnerId(learnerId);
        purchase.setPaymentId(paymentId);
        purchase.setAmountCents(set.getPriceCents());
        purchase.setCurrency(set.getCurrency());
        purchase.setStatus(COMPLETED);
        if (set.getValidityDays() != null && set.getValidityDays() > 0) {
            purchase.setExpiresAt(Instant.now().plus(set.getValidityDays(), ChronoUnit.DAYS));
        }
        purchaseRepository.save(purchase);
        set.setSalesCount(set.getSalesCount() + 1);
        setRepository.save(set);
        contentNotificationService.notifyInterviewPackPurchased(set.getTitle(), learnerId, set.getMentorId());
        return toCard(set, learnerId);
    }

    @Transactional
    public InterviewPackCardResponse enrollFreePack(UUID learnerId, UUID packId) {
        InterviewQuestionSet set = requirePublishedPack(packId);
        if (!"PUBLIC_FREE".equals(set.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pack is not free");
        }
        if (!hasPackAccess(learnerId, set)) {
            InterviewQuestionSetPurchase purchase = new InterviewQuestionSetPurchase();
            purchase.setQuestionSetId(packId);
            purchase.setLearnerId(learnerId);
            purchase.setAmountCents(0);
            purchase.setCurrency(set.getCurrency());
            purchase.setStatus(COMPLETED);
            purchaseRepository.save(purchase);
        }
        return toCard(set, learnerId);
    }

    @Transactional(readOnly = true)
    public InterviewPageResponse<InterviewPurchaseResponse> myPurchases(UUID learnerId, int page, int size) {
        List<InterviewQuestionSetPurchase> all = purchaseRepository
            .findByLearnerIdAndDeletedAtIsNullOrderByPurchasedAtDesc(learnerId);
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        List<InterviewPurchaseResponse> slice = all.subList(from, to).stream()
            .map(this::toPurchase)
            .toList();
        return new InterviewPageResponse<>(slice, page, size, all.size(), to < all.size());
    }

    @Transactional
    public InterviewPackReviewResponse addReview(UUID learnerId, UUID packId, CreatePackReviewRequest request) {
        InterviewQuestionSet set = requirePublishedPack(packId);
        if (!hasPackAccess(learnerId, set)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Purchase required to review");
        }
        if (reviewRepository.existsByQuestionSetIdAndLearnerIdAndDeletedAtIsNull(packId, learnerId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already reviewed");
        }
        InterviewPackReview review = new InterviewPackReview();
        review.setQuestionSetId(packId);
        review.setLearnerId(learnerId);
        review.setRating(request.rating());
        review.setReviewText(trimOrNull(request.reviewText()));
        reviewRepository.save(review);
        recalculateRating(set);
        return new InterviewPackReviewResponse(
            review.getId(), "You", review.getRating(), review.getReviewText(), DATE_FMT.format(review.getCreatedAt())
        );
    }

    // ── Learner assignments ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InterviewAssignmentCardResponse> myAssignments(UUID learnerId) {
        return assignmentRepository.findByLearnerIdAndDeletedAtIsNullOrderByAssignedAtDesc(learnerId).stream()
            .map(a -> toAssignmentCard(a, learnerId))
            .toList();
    }

    @Transactional(readOnly = true)
    public InterviewAssignmentDetailResponse getAssignment(UUID learnerId, UUID assignmentId) {
        InterviewQuestionAssignment assignment = assignmentRepository
            .findByIdAndLearnerIdAndDeletedAtIsNull(assignmentId, learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        return toAssignmentDetail(assignment, true);
    }

    @Transactional
    public InterviewAssignmentDetailResponse submitAnswers(UUID learnerId, UUID assignmentId, SubmitInterviewAnswersRequest request) {
        InterviewQuestionAssignment assignment = assignmentRepository
            .findByIdAndLearnerIdAndDeletedAtIsNull(assignmentId, learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        if (List.of("REVIEWED", "COMPLETED").contains(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment already reviewed");
        }
        for (SubmitInterviewAnswersRequest.AnswerSubmission answer : request.answers()) {
            InterviewAssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndQuestionId(assignmentId, answer.questionId())
                .orElseGet(InterviewAssignmentSubmission::new);
            submission.setAssignmentId(assignmentId);
            submission.setQuestionId(answer.questionId());
            submission.setAnswerType(answer.answerType().toUpperCase(Locale.ROOT));
            submission.setAnswerText(trimOrNull(answer.answerText()));
            submission.setAnswerCode(trimOrNull(answer.answerCode()));
            submission.setCodeLanguage(trimOrNull(answer.codeLanguage()));
            submission.setFileUrl(trimOrNull(answer.fileUrl()));
            submission.setFileName(trimOrNull(answer.fileName()));
            submissionRepository.save(submission);
        }
        assignment.setStatus("SUBMITTED");
        assignment.setSubmittedAt(Instant.now());
        assignmentRepository.save(assignment);
        contentNotificationService.notifyInterviewSubmissionReceived(
            assignment.getMentorId(), assignment.getLearnerId(), assignmentId
        );
        return toAssignmentDetail(assignment, true);
    }

    @Transactional(readOnly = true)
    public List<InterviewFeedbackResponse> myFeedback(UUID learnerId) {
        return feedbackRepository.findByLearnerIdOrderByReviewedAtDesc(learnerId).stream()
            .map(this::toFeedback)
            .toList();
    }

    // ── Mentor workspace ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InterviewPackCardResponse> mentorPacks(UUID mentorId) {
        requireMentor(mentorId);
        return setRepository.findByMentorIdAndDeletedAtIsNullOrderByUpdatedAtDesc(mentorId).stream()
            .map(s -> toCard(s, null))
            .toList();
    }

    @Transactional
    public InterviewPackCardResponse createPack(UUID mentorId, CreateInterviewQuestionSetRequest request) {
        requireMentor(mentorId);
        validateVisibility(request.visibility(), request.priceCents());
        InterviewQuestionSet set = new InterviewQuestionSet();
        set.setMentorId(mentorId);
        applyPackFields(set, request.title(), request.description(), request.instructions(),
            request.durationMinutes(), request.difficulty(), request.thumbnailUrl(), request.tags(),
            request.visibility(), request.priceCents(), request.currency(), request.validityDays());
        set.setCreatedBy(mentorId);
        set.setUpdatedBy(mentorId);
        applyPublishState(set, request.visibility(), request.publish());
        InterviewQuestionSet saved = setRepository.save(set);
        saveItems(saved.getId(), request.questionIds());
        if ("ASSIGNED_ONLY".equalsIgnoreCase(saved.getVisibility()) && request.assignToLearnerIds() != null) {
            assignToLearners(saved, request.assignToLearnerIds(), request.dueAt(), mentorId);
        }
        if (PUBLISHED.equals(saved.getStatus()) && isPublicVisibility(saved.getVisibility())) {
            contentNotificationService.notifyInterviewPackPublished(saved.getTitle(), mentorId);
        }
        log.info(
            "Created interview pack {} visibility={} status={} questions={} mentor={}",
            saved.getId(), saved.getVisibility(), saved.getStatus(), request.questionIds().size(), mentorId
        );
        return toCard(saved, null);
    }

    @Transactional
    public InterviewPackCardResponse publishPack(UUID mentorId, UUID packId) {
        InterviewQuestionSet set = requireOwnPack(mentorId, packId);
        if (!isPublicVisibility(set.getVisibility())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only Public Free or Public Paid packs can be published to the marketplace"
            );
        }
        applyPublishState(set, set.getVisibility(), true);
        set.setUpdatedBy(mentorId);
        InterviewQuestionSet saved = setRepository.save(set);
        contentNotificationService.notifyInterviewPackPublished(saved.getTitle(), mentorId);
        log.info("Published interview pack {} to marketplace (mentor={})", saved.getId(), mentorId);
        return toCard(saved, null);
    }

    @Transactional
    public InterviewPackCardResponse updatePack(UUID mentorId, UUID packId, UpdateInterviewQuestionSetRequest request) {
        InterviewQuestionSet set = requireOwnPack(mentorId, packId);
        if (request.title() != null) set.setTitle(request.title().trim());
        if (request.description() != null) set.setDescription(trimOrNull(request.description()));
        if (request.instructions() != null) set.setInstructions(trimOrNull(request.instructions()));
        if (request.durationMinutes() != null) set.setDurationMinutes(request.durationMinutes());
        if (request.difficulty() != null) set.setDifficulty(normalizeDifficulty(request.difficulty()));
        if (request.thumbnailUrl() != null) set.setThumbnailUrl(trimOrNull(request.thumbnailUrl()));
        if (request.tags() != null) set.setTags(trimOrNull(request.tags()));
        if (request.visibility() != null) {
            validateVisibility(request.visibility(), request.priceCents() != null ? request.priceCents() : set.getPriceCents());
            set.setVisibility(request.visibility().toUpperCase(Locale.ROOT));
            if (isPublicVisibility(set.getVisibility())) {
                applyPublishState(set, set.getVisibility(), true);
            }
        }
        if (request.priceCents() != null) set.setPriceCents(request.priceCents());
        if (request.currency() != null) set.setCurrency(request.currency().toUpperCase(Locale.ROOT));
        if (request.validityDays() != null) set.setValidityDays(request.validityDays());
        set.setUpdatedBy(mentorId);
        if (request.questionIds() != null) {
            itemRepository.deleteByQuestionSetId(packId);
            saveItems(packId, request.questionIds());
        }
        InterviewQuestionSet saved = setRepository.save(set);
        if (request.assignToLearnerIds() != null) {
            assignToLearners(saved, request.assignToLearnerIds(), request.dueAt(), mentorId);
        }
        return toCard(saved, null);
    }

    @Transactional
    public void deletePack(UUID mentorId, UUID packId) {
        InterviewQuestionSet set = requireOwnPack(mentorId, packId);
        set.setDeletedAt(Instant.now());
        setRepository.save(set);
    }

    @Transactional
    public void duplicatePack(UUID mentorId, UUID packId) {
        InterviewQuestionSet source = requireOwnPack(mentorId, packId);
        InterviewQuestionSet copy = new InterviewQuestionSet();
        copy.setMentorId(mentorId);
        copy.setTitle(source.getTitle() + " (Copy)");
        copy.setDescription(source.getDescription());
        copy.setInstructions(source.getInstructions());
        copy.setDurationMinutes(source.getDurationMinutes());
        copy.setDifficulty(source.getDifficulty());
        copy.setThumbnailUrl(source.getThumbnailUrl());
        copy.setTags(source.getTags());
        copy.setVisibility("ASSIGNED_ONLY");
        copy.setPriceCents(source.getPriceCents());
        copy.setCurrency(source.getCurrency());
        copy.setValidityDays(source.getValidityDays());
        copy.setStatus("DRAFT");
        copy.setCreatedBy(mentorId);
        copy.setUpdatedBy(mentorId);
        InterviewQuestionSet saved = setRepository.save(copy);
        List<UUID> questionIds = itemRepository.findByQuestionSetIdOrderBySortOrderAsc(packId).stream()
            .map(InterviewQuestionSetItem::getQuestionId)
            .toList();
        saveItems(saved.getId(), questionIds);
    }

    @Transactional(readOnly = true)
    public List<InterviewAssignmentCardResponse> mentorAssignments(UUID mentorId, String status) {
        requireMentor(mentorId);
        List<InterviewQuestionAssignment> list = status != null && !status.isBlank()
            ? assignmentRepository.findByMentorIdAndStatusAndDeletedAtIsNullOrderByAssignedAtDesc(
                mentorId, status.toUpperCase(Locale.ROOT))
            : assignmentRepository.findByMentorIdAndDeletedAtIsNullOrderByAssignedAtDesc(mentorId);
        return list.stream().map(a -> toAssignmentCard(a, a.getLearnerId())).toList();
    }

    @Transactional(readOnly = true)
    public InterviewAssignmentDetailResponse mentorAssignmentDetail(UUID mentorId, UUID assignmentId) {
        InterviewQuestionAssignment assignment = assignmentRepository
            .findByIdAndMentorIdAndDeletedAtIsNull(assignmentId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        return toAssignmentDetail(assignment, false);
    }

    @Transactional
    public InterviewFeedbackResponse submitFeedback(UUID mentorId, UUID assignmentId, SubmitInterviewFeedbackRequest request) {
        InterviewQuestionAssignment assignment = assignmentRepository
            .findByIdAndMentorIdAndDeletedAtIsNull(assignmentId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        InterviewMentorFeedback feedback = feedbackRepository.findByAssignmentId(assignmentId)
            .orElseGet(InterviewMentorFeedback::new);
        feedback.setAssignmentId(assignmentId);
        feedback.setMentorId(mentorId);
        feedback.setLearnerId(assignment.getLearnerId());
        feedback.setOverallScore(request.overallScore());
        feedback.setStrengths(trimOrNull(request.strengths()));
        feedback.setImprovements(trimOrNull(request.improvements()));
        feedback.setRecommendations(trimOrNull(request.recommendations()));
        feedback.setComments(trimOrNull(request.comments()));
        feedback.markReviewed(Instant.now());
        feedbackRepository.save(feedback);
        assignment.setStatus("REVIEWED");
        assignmentRepository.save(assignment);
        contentNotificationService.notifyInterviewFeedbackAvailable(assignment.getLearnerId(), assignmentId);
        return toFeedback(feedback);
    }

    @Transactional(readOnly = true)
    public InterviewAnalyticsResponse mentorAnalytics(UUID mentorId) {
        requireMentor(mentorId);
        long sets = setRepository.countByMentorIdAndDeletedAtIsNull(mentorId);
        long freePacks = setRepository.countByMentorIdAndVisibilityAndDeletedAtIsNull(mentorId, "PUBLIC_FREE");
        long paidPacks = setRepository.countByMentorIdAndVisibilityAndDeletedAtIsNull(mentorId, "PUBLIC_PAID");
        long assignments = assignmentRepository.findByMentorIdAndDeletedAtIsNullOrderByAssignedAtDesc(mentorId).size();
        long pendingReviews = assignmentRepository.countByMentorIdAndStatusAndDeletedAtIsNull(mentorId, "SUBMITTED");
        long revenue = purchaseRepository.sumRevenueCentsByMentor(mentorId);
        double avgRating = setRepository.findByMentorIdAndDeletedAtIsNullOrderByUpdatedAtDesc(mentorId).stream()
            .mapToDouble(s -> s.getAvgRating().doubleValue())
            .average().orElse(0);
        long completed = assignmentRepository.findByMentorIdAndDeletedAtIsNullOrderByAssignedAtDesc(mentorId).stream()
            .filter(a -> List.of("REVIEWED", "COMPLETED").contains(a.getStatus()))
            .count();
        double completionRate = assignments == 0 ? 0 : (completed * 100.0 / assignments);
        return new InterviewAnalyticsResponse(
            (int) sets, (int) freePacks, (int) paidPacks, (int) assignments,
            (int) purchaseRepository.countPurchasesByMentor(mentorId),
            revenue, formatMoney(revenue, "INR"), (int) pendingReviews, avgRating, completionRate,
            List.of(), List.of(), List.of()
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void saveItems(UUID setId, List<UUID> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one question required");
        }
        int order = 0;
        for (UUID questionId : questionIds) {
            InterviewQuestionSetItem item = new InterviewQuestionSetItem();
            item.setQuestionSetId(setId);
            item.setQuestionId(questionId);
            item.setSortOrder(order++);
            itemRepository.save(item);
        }
    }

    private void assignToLearners(InterviewQuestionSet set, List<UUID> learnerIds, Instant dueAt, UUID mentorId) {
        Set<UUID> existing = assignmentRepository.findByMentorIdAndDeletedAtIsNullOrderByAssignedAtDesc(mentorId)
            .stream()
            .filter(a -> a.getQuestionSetId().equals(set.getId()))
            .map(InterviewQuestionAssignment::getLearnerId)
            .collect(Collectors.toSet());
        for (UUID learnerId : new HashSet<>(learnerIds)) {
            if (existing.contains(learnerId)) continue;
            InterviewQuestionAssignment assignment = new InterviewQuestionAssignment();
            assignment.setQuestionSetId(set.getId());
            assignment.setLearnerId(learnerId);
            assignment.setMentorId(mentorId);
            assignment.setDueAt(dueAt);
            assignment.setStatus("PENDING");
            assignment.setCreatedBy(mentorId);
            assignmentRepository.save(assignment);
            contentNotificationService.notifyInterviewAssignmentReceived(learnerId, set.getTitle(), mentorId);
        }
    }

    private void applyPackFields(
        InterviewQuestionSet set, String title, String description, String instructions,
        int durationMinutes, String difficulty, String thumbnailUrl, String tags,
        String visibility, int priceCents, String currency, Integer validityDays
    ) {
        set.setTitle(title.trim());
        set.setDescription(trimOrNull(description));
        set.setInstructions(trimOrNull(instructions));
        set.setDurationMinutes(durationMinutes);
        set.setDifficulty(normalizeDifficulty(difficulty));
        set.setThumbnailUrl(trimOrNull(thumbnailUrl));
        set.setTags(trimOrNull(tags));
        set.setVisibility(visibility.toUpperCase(Locale.ROOT));
        set.setPriceCents(priceCents);
        set.setCurrency(currency != null ? currency.toUpperCase(Locale.ROOT) : "INR");
        set.setValidityDays(validityDays);
    }

    private InterviewQuestionSet requirePublishedPack(UUID packId) {
        InterviewQuestionSet set = setRepository.findByIdAndDeletedAtIsNull(packId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pack not found"));
        if (!PUBLISHED.equals(set.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pack not published");
        }
        if (!isPublicVisibility(set.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pack not available on marketplace");
        }
        return set;
    }

    private InterviewQuestionSet requireOwnPack(UUID mentorId, UUID packId) {
        return setRepository.findByIdAndMentorIdAndDeletedAtIsNull(packId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pack not found"));
    }

    private boolean hasPackAccess(UUID learnerId, InterviewQuestionSet set) {
        if (assignmentRepository.findByLearnerIdAndDeletedAtIsNullOrderByAssignedAtDesc(learnerId).stream()
            .anyMatch(a -> a.getQuestionSetId().equals(set.getId()))) {
            return true;
        }
        return purchaseRepository.findByQuestionSetIdAndLearnerIdAndDeletedAtIsNull(set.getId(), learnerId)
            .map(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(Instant.now()))
            .orElse(false);
    }

    private InterviewPackCardResponse toCard(InterviewQuestionSet set, UUID learnerId) {
        int count = (int) itemRepository.countByQuestionSetId(set.getId());
        boolean purchased = learnerId != null && hasPackAccess(learnerId, set);
        boolean free = "PUBLIC_FREE".equals(set.getVisibility());
        return new InterviewPackCardResponse(
            set.getId(), set.getTitle(), set.getDescription(), set.getThumbnailUrl(),
            mentorName(set.getMentorId()), set.getMentorId(), mentorRating(set.getMentorId()),
            set.getDifficulty(), difficultyLabel(set.getDifficulty()), count, set.getDurationMinutes(),
            set.getVisibility(), set.getStatus(), set.getPriceCents(), set.getCurrency(),
            formatMoney(set.getPriceCents(), set.getCurrency()),
            validityLabel(set.getValidityDays()), set.getAvgRating().doubleValue(), set.getReviewCount(),
            set.getSalesCount(), purchased, free, parseTags(set.getTags())
        );
    }

    private InterviewPackDetailResponse toDetail(InterviewQuestionSet set, UUID learnerId, boolean preview, boolean hasAccess) {
        List<InterviewQuestionSetItem> items = itemRepository.findByQuestionSetIdOrderBySortOrderAsc(set.getId());
        List<InterviewPackQuestionPreview> allQuestions = buildQuestionPreviews(items, !preview && hasAccess);
        List<InterviewPackQuestionPreview> sample = allQuestions.stream().limit(3).toList();
        List<InterviewPackReviewResponse> reviews = reviewRepository
            .findByQuestionSetIdAndDeletedAtIsNullOrderByCreatedAtDesc(set.getId()).stream()
            .limit(10)
            .map(r -> new InterviewPackReviewResponse(
                r.getId(), "Learner", r.getRating(), r.getReviewText(), DATE_FMT.format(r.getCreatedAt())
            ))
            .toList();
        boolean free = "PUBLIC_FREE".equals(set.getVisibility());
        return new InterviewPackDetailResponse(
            set.getId(), set.getTitle(), set.getDescription(), set.getInstructions(), set.getThumbnailUrl(),
            mentorName(set.getMentorId()), set.getMentorId(), mentorRating(set.getMentorId()),
            set.getDifficulty(), difficultyLabel(set.getDifficulty()), items.size(), set.getDurationMinutes(),
            set.getVisibility(), set.getPriceCents(), set.getCurrency(),
            formatMoney(set.getPriceCents(), set.getCurrency()), validityLabel(set.getValidityDays()),
            set.getValidityDays(), set.getAvgRating().doubleValue(), set.getReviewCount(),
            hasAccess, hasAccess, free, parseTags(set.getTags()),
            sample, preview ? List.of() : allQuestions, reviews
        );
    }

    private List<InterviewPackQuestionPreview> buildQuestionPreviews(List<InterviewQuestionSetItem> items, boolean unlocked) {
        List<InterviewPackQuestionPreview> result = new ArrayList<>();
        for (InterviewQuestionSetItem item : items) {
            questionRepository.findById(item.getQuestionId()).ifPresent(q -> result.add(
                new InterviewPackQuestionPreview(
                    q.getId(),
                    q.getTitle() != null ? q.getTitle() : truncate(q.getQuestionText(), 80),
                    q.getQuestionText(),
                    q.getCategory(), q.getCategory(),
                    q.getDifficulty(), difficultyLabel(q.getDifficulty()),
                    q.getEstimatedMinutes(),
                    !unlocked
                )
            ));
        }
        return result;
    }

    private InterviewAssignmentCardResponse toAssignmentCard(InterviewQuestionAssignment a, UUID viewerId) {
        InterviewQuestionSet set = setRepository.findById(a.getQuestionSetId()).orElse(null);
        int count = set != null ? (int) itemRepository.countByQuestionSetId(set.getId()) : 0;
        InterviewMentorFeedback feedback = feedbackRepository.findByAssignmentId(a.getId()).orElse(null);
        return new InterviewAssignmentCardResponse(
            a.getId(), a.getQuestionSetId(),
            set != null ? set.getTitle() : "Assessment",
            mentorName(a.getMentorId()), a.getMentorId(), count,
            a.getDueAt() != null ? DATE_FMT.format(a.getDueAt()) : "No due date",
            a.getDueAt(), a.getStatus(), STATUS_LABELS.getOrDefault(a.getStatus(), a.getStatus()),
            feedback != null, feedback != null ? feedback.getOverallScore().doubleValue() : null,
            a.getAssignedAt()
        );
    }

    private InterviewAssignmentDetailResponse toAssignmentDetail(InterviewQuestionAssignment a, boolean hideAnswers) {
        InterviewQuestionSet set = setRepository.findById(a.getQuestionSetId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pack not found"));
        List<InterviewQuestionSetItem> items = itemRepository.findByQuestionSetIdOrderBySortOrderAsc(set.getId());
        List<InterviewQuestionSolveResponse> questions = new ArrayList<>();
        for (InterviewQuestionSetItem item : items) {
            var qOpt = questionRepository.findById(item.getQuestionId());
            if (qOpt.isEmpty()) continue;
            var q = qOpt.get();
            questions.add(new InterviewQuestionSolveResponse(
                q.getId(), questions.size() + 1,
                q.getTitle() != null ? q.getTitle() : truncate(q.getQuestionText(), 60),
                q.getQuestionText(), q.getDescription(), q.getCategory(), q.getDifficulty(), q.getEstimatedMinutes()
            ));
        }
        List<InterviewSubmissionResponse> submissions = submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(a.getId())
            .stream()
            .map(s -> new InterviewSubmissionResponse(
                s.getQuestionId(), s.getAnswerType(), s.getAnswerText(), s.getAnswerCode(),
                s.getCodeLanguage(), s.getFileUrl(), s.getFileName()
            ))
            .toList();
        InterviewMentorFeedback feedback = feedbackRepository.findByAssignmentId(a.getId()).orElse(null);
        return new InterviewAssignmentDetailResponse(
            a.getId(), set.getId(), set.getTitle(), set.getInstructions(), set.getDurationMinutes(),
            a.getStatus(), questions, submissions, feedback != null ? toFeedback(feedback) : null
        );
    }

    private InterviewFeedbackResponse toFeedback(InterviewMentorFeedback f) {
        return new InterviewFeedbackResponse(
            f.getId(), f.getOverallScore(), f.getStrengths(), f.getImprovements(),
            f.getRecommendations(), f.getComments(), DATE_FMT.format(f.getReviewedAt())
        );
    }

    private InterviewPurchaseResponse toPurchase(InterviewQuestionSetPurchase p) {
        InterviewQuestionSet set = setRepository.findById(p.getQuestionSetId()).orElse(null);
        boolean expired = p.getExpiresAt() != null && p.getExpiresAt().isBefore(Instant.now());
        return new InterviewPurchaseResponse(
            p.getId(), p.getQuestionSetId(),
            set != null ? set.getTitle() : "Interview Pack",
            set != null ? set.getThumbnailUrl() : null,
            set != null ? mentorName(set.getMentorId()) : "Mentor",
            p.getAmountCents(), p.getCurrency(), formatMoney(p.getAmountCents(), p.getCurrency()),
            p.getStatus(), DATE_FMT.format(p.getPurchasedAt()),
            p.getExpiresAt() != null ? DATE_FMT.format(p.getExpiresAt()) : "Lifetime",
            expired, !expired
        );
    }

    private void recalculateRating(InterviewQuestionSet set) {
        List<InterviewPackReview> reviews = reviewRepository.findByQuestionSetIdAndDeletedAtIsNullOrderByCreatedAtDesc(set.getId());
        if (reviews.isEmpty()) return;
        double avg = reviews.stream().mapToInt(InterviewPackReview::getRating).average().orElse(0);
        set.setAvgRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
        set.setReviewCount(reviews.size());
        setRepository.save(set);
    }

    private String mentorName(UUID mentorId) {
        return mentorProfileRepository.findById(mentorId)
            .map(MentorProfile::getHeadline)
            .filter(h -> h != null && !h.isBlank())
            .orElse("Mentor");
    }

    private double mentorRating(UUID mentorId) {
        return mentorProfileRepository.findById(mentorId).map(MentorProfile::getAverageRating).orElse(0.0);
    }

    private void requireMentor(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
    }

    private void validateVisibility(String visibility, int priceCents) {
        String v = visibility.toUpperCase(Locale.ROOT);
        if (!Set.of("ASSIGNED_ONLY", "PUBLIC_FREE", "PUBLIC_PAID").contains(v)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid visibility");
        }
        if ("PUBLIC_PAID".equals(v) && priceCents <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paid packs require price > 0");
        }
    }

    private void applyPublishState(InterviewQuestionSet set, String visibility, Boolean publish) {
        boolean publicPack = isPublicVisibility(visibility);
        boolean shouldPublish = publicPack && (publish == null || publish);
        if (shouldPublish) {
            set.setStatus(PUBLISHED);
            if (set.getPublishedAt() == null) {
                set.setPublishedAt(Instant.now());
            }
        } else if (publicPack) {
            set.setStatus(DRAFT);
        } else {
            set.setStatus(PUBLISHED);
            if (set.getPublishedAt() == null) {
                set.setPublishedAt(Instant.now());
            }
        }
    }

    private boolean isPublicVisibility(String visibility) {
        if (visibility == null) {
            return false;
        }
        String v = visibility.toUpperCase(Locale.ROOT);
        return "PUBLIC_FREE".equals(v) || "PUBLIC_PAID".equals(v);
    }

    private boolean matchesSearch(InterviewQuestionSet set, String search) {
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(set.getTitle(), q)
            || containsIgnoreCase(set.getDescription(), q)
            || containsIgnoreCase(set.getTags(), q);
    }

    private boolean containsTag(String tags, String category) {
        if (tags == null || category == null) {
            return false;
        }
        return tags.toLowerCase(Locale.ROOT).contains(category.toLowerCase(Locale.ROOT));
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return null;
        return difficulty.toLowerCase(Locale.ROOT);
    }

    private String difficultyLabel(String difficulty) {
        return DIFFICULTY_LABELS.getOrDefault(difficulty, difficulty);
    }

    private String formatMoney(long cents, String currency) {
        String sym = "INR".equalsIgnoreCase(currency) ? "₹" : currency + " ";
        return sym + BigDecimal.valueOf(cents).movePointLeft(2).setScale(0, RoundingMode.HALF_UP);
    }

    private String validityLabel(Integer days) {
        if (days == null || days <= 0) return "Lifetime Access";
        return days + " Days Access";
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
