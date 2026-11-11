package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateMentorFeedbackRequest;
import com.developersconnect.mentor.dto.CreateMentorMentorshipPlanRequest;
import com.developersconnect.mentor.dto.MentorFeedbackSummaryResponse;
import com.developersconnect.mentor.dto.MentorFeedbackTestimonialResponse;
import com.developersconnect.mentor.dto.MentorMentorshipPlanResponse;
import com.developersconnect.mentor.dto.MentorReviewResponse;
import com.developersconnect.mentor.dto.MentorReviewsSummaryResponse;
import com.developersconnect.mentor.dto.ReplyMentorReviewRequest;
import com.developersconnect.mentor.dto.UpdateMentorMentorshipPlanRequest;
import com.developersconnect.mentor.model.MentorMentorshipPlan;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorReview;
import com.developersconnect.mentor.repository.MentorMentorshipPlanRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorReviewRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorPlansReviewsService {

    private static final String FEATURE_DELIM = "|||";
    private static final Map<String, String> PLAN_TYPE_LABELS = Map.of(
        "one_on_one", "1:1 Mentorship",
        "weekly", "Weekly Mentorship",
        "monthly", "Monthly Coaching",
        "mock_interview", "Mock Interview Pack",
        "job_switch", "Job-Switch Roadmap"
    );
    private static final Map<String, String> BILLING_LABELS = Map.of(
        "one_time", "One-time payment",
        "weekly_subscription", "Weekly subscription",
        "monthly_subscription", "Monthly subscription"
    );
    private static final Set<String> PLAN_TYPES = PLAN_TYPE_LABELS.keySet();
    private static final Set<String> BILLING_TYPES = BILLING_LABELS.keySet();

    private final MentorMentorshipPlanRepository planRepository;
    private final MentorReviewRepository reviewRepository;
    private final MentorProfileRepository profileRepository;
    private final MentorProfileService mentorProfileService;
    private final MentorshipRequestService mentorshipRequestService;

    public MentorPlansReviewsService(
        MentorMentorshipPlanRepository planRepository,
        MentorReviewRepository reviewRepository,
        MentorProfileRepository profileRepository,
        MentorProfileService mentorProfileService,
        MentorshipRequestService mentorshipRequestService
    ) {
        this.planRepository = planRepository;
        this.reviewRepository = reviewRepository;
        this.profileRepository = profileRepository;
        this.mentorProfileService = mentorProfileService;
        this.mentorshipRequestService = mentorshipRequestService;
    }

    @Transactional(readOnly = true)
    public List<MentorMentorshipPlanResponse> listPlans(UUID mentorId) {
        requireApprovedMentor(mentorId);
        return planRepository.findByMentorIdOrderBySortOrderAsc(mentorId).stream()
            .map(this::toPlanResponse)
            .toList();
    }

    @Transactional
    public MentorMentorshipPlanResponse createPlan(UUID mentorId, CreateMentorMentorshipPlanRequest request) {
        requireApprovedMentor(mentorId);
        validatePlanType(request.planType());
        validateBillingType(request.billingType());

        int nextOrder = planRepository.findByMentorIdOrderBySortOrderAsc(mentorId).stream()
            .mapToInt(MentorMentorshipPlan::getSortOrder)
            .max()
            .orElse(-1) + 1;

        if (request.popular()) {
            clearPopular(mentorId);
        }

        MentorMentorshipPlan plan = new MentorMentorshipPlan();
        plan.setMentorId(mentorId);
        applyPlanFields(plan, request.title(), request.description(), request.planType(), request.billingType(),
            request.priceCents(), request.sessionLimit(), request.durationMinutes(), request.durationLabel(),
            request.premiumSupport(), request.popular(), request.active(),
            request.sortOrder() != null ? request.sortOrder() : nextOrder, request.features());
        return toPlanResponse(planRepository.save(plan));
    }

    @Transactional
    public MentorMentorshipPlanResponse updatePlan(UUID mentorId, UUID planId, UpdateMentorMentorshipPlanRequest request) {
        requireApprovedMentor(mentorId);
        MentorMentorshipPlan plan = planRepository.findByIdAndMentorId(planId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found"));

        if (request.planType() != null) {
            validatePlanType(request.planType());
            plan.setPlanType(request.planType());
        }
        if (request.billingType() != null) {
            validateBillingType(request.billingType());
            plan.setBillingType(request.billingType());
        }
        if (request.title() != null && !request.title().isBlank()) {
            plan.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            plan.setDescription(request.description());
        }
        if (request.priceCents() != null) {
            plan.setPriceCents(request.priceCents());
        }
        if (request.sessionLimit() != null) {
            plan.setSessionLimit(request.sessionLimit());
        }
        if (request.durationMinutes() != null) {
            plan.setDurationMinutes(request.durationMinutes());
        }
        if (request.durationLabel() != null) {
            plan.setDurationLabel(request.durationLabel());
        }
        if (request.premiumSupport() != null) {
            plan.setPremiumSupport(request.premiumSupport());
        }
        if (request.popular() != null) {
            if (request.popular()) {
                clearPopular(mentorId);
            }
            plan.setPopular(request.popular());
        }
        if (request.active() != null) {
            plan.setActive(request.active());
        }
        if (request.sortOrder() != null) {
            plan.setSortOrder(request.sortOrder());
        }
        if (request.features() != null) {
            plan.setFeatures(encodeFeatures(request.features()));
        }

        return toPlanResponse(planRepository.save(plan));
    }

    @Transactional
    public void deletePlan(UUID mentorId, UUID planId) {
        requireApprovedMentor(mentorId);
        MentorMentorshipPlan plan = planRepository.findByIdAndMentorId(planId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found"));
        planRepository.delete(plan);
    }

    @Transactional(readOnly = true)
    public MentorFeedbackSummaryResponse getFeedbackSummary(UUID mentorId) {
        requireApprovedMentor(mentorId);
        List<MentorReview> reviews = reviewRepository.findByMentorIdOrderByCreatedAtDesc(mentorId);

        double averageRating = reviews.isEmpty()
            ? 0.0
            : reviews.stream().mapToInt(MentorReview::getRating).sum() / (double) reviews.size();
        averageRating = Math.round(averageRating * 10.0) / 10.0;

        Map<String, Long> ratingDistribution = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            int starValue = star;
            long count = reviews.stream().filter(r -> r.getRating() == starValue).count();
            ratingDistribution.put(String.valueOf(star), count);
        }

        long totalTestimonials = reviewRepository.countTestimonialsWithComment(mentorId);

        List<String> improvementSuggestions = reviews.stream()
            .map(MentorReview::getImprovementSuggestion)
            .filter(s -> s != null && !s.isBlank())
            .distinct()
            .limit(10)
            .toList();

        ZoneId zone = ZoneId.systemDefault();
        List<MentorFeedbackTestimonialResponse> testimonials = reviews.stream()
            .filter(r -> r.getReviewText() != null && !r.getReviewText().isBlank())
            .map(r -> new MentorFeedbackTestimonialResponse(
                r.getLearnerName(),
                r.getRating(),
                r.getReviewText(),
                r.getCreatedAt().atZone(zone).toLocalDate()
            ))
            .toList();

        List<MentorReviewResponse> reviewResponses = reviews.stream().map(this::toReviewResponse).toList();
        long showcasedCount = reviews.stream().filter(MentorReview::isShowcased).count();
        int visibilityBoost = (int) Math.min(100, averageRating * 18 + showcasedCount * 5);
        int trustScore = (int) Math.min(100, averageRating * 20 + Math.min(reviews.size(), 10) * 3);

        return new MentorFeedbackSummaryResponse(
            averageRating,
            reviews.size(),
            totalTestimonials,
            trustScore,
            visibilityBoost,
            ratingDistribution,
            improvementSuggestions,
            testimonials,
            reviewResponses
        );
    }

    @Transactional
    public MentorReviewResponse submitFeedback(
        UUID mentorId,
        UUID studentId,
        String studentName,
        CreateMentorFeedbackRequest request
    ) {
        if (studentId.equals(mentorId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mentors cannot review themselves");
        }
        if (!mentorshipRequestService.hasActiveRelationship(mentorId, studentId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only review mentors with an accepted mentorship relationship"
            );
        }
        if (reviewRepository.findByMentorIdAndLearnerId(mentorId, studentId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already submitted feedback for this mentor");
        }

        MentorReview review = new MentorReview();
        review.setMentorId(mentorId);
        review.setLearnerId(studentId);
        review.setLearnerName(studentName != null && !studentName.isBlank() ? studentName.trim() : "Student");
        review.setRating(request.rating());
        review.setReviewText(request.comment().trim());
        review.setTopic(request.topic() != null ? request.topic().trim() : null);
        review.setImprovementSuggestion(
            request.improvementSuggestion() != null ? request.improvementSuggestion().trim() : null
        );
        review.setShowcased(false);

        MentorReview saved = reviewRepository.save(review);
        syncMentorProfileRating(mentorId);
        return toReviewResponse(saved);
    }

    private void syncMentorProfileRating(UUID mentorId) {
        List<MentorReview> reviews = reviewRepository.findByMentorIdOrderByCreatedAtDesc(mentorId);
        profileRepository.findById(mentorId).ifPresent(profile -> {
            if (reviews.isEmpty()) {
                profile.setAverageRating(0.0);
                profile.setRatingCount(0);
            } else {
                double avg = reviews.stream().mapToInt(MentorReview::getRating).average().orElse(0.0);
                profile.setAverageRating(Math.round(avg * 10.0) / 10.0);
                profile.setRatingCount(reviews.size());
            }
            profileRepository.save(profile);
        });
    }

    /** @deprecated Use {@link #getFeedbackSummary(UUID)} */
    @Transactional(readOnly = true)
    public MentorReviewsSummaryResponse getReviewsSummary(UUID mentorId) {
        MentorFeedbackSummaryResponse summary = getFeedbackSummary(mentorId);
        List<Integer> distribution = List.of(
            summary.ratingDistribution().getOrDefault("1", 0L).intValue(),
            summary.ratingDistribution().getOrDefault("2", 0L).intValue(),
            summary.ratingDistribution().getOrDefault("3", 0L).intValue(),
            summary.ratingDistribution().getOrDefault("4", 0L).intValue(),
            summary.ratingDistribution().getOrDefault("5", 0L).intValue()
        );
        List<MentorReviewResponse> showcased = summary.reviews().stream()
            .filter(MentorReviewResponse::showcased)
            .toList();
        return new MentorReviewsSummaryResponse(
            summary.averageRating(),
            summary.totalReviews(),
            showcased.size(),
            summary.visibilityBoostPct(),
            summary.trustScorePct(),
            distribution,
            summary.improvementSuggestions(),
            summary.reviews(),
            showcased
        );
    }

    @Transactional
    public MentorReviewResponse replyToReview(UUID mentorId, UUID reviewId, ReplyMentorReviewRequest request) {
        requireApprovedMentor(mentorId);
        MentorReview review = reviewRepository.findByIdAndMentorId(reviewId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        review.setMentorReply(request.reply().trim());
        review.setRepliedAt(Instant.now());
        return toReviewResponse(reviewRepository.save(review));
    }

    @Transactional
    public MentorReviewResponse toggleShowcase(UUID mentorId, UUID reviewId, boolean showcased) {
        requireApprovedMentor(mentorId);
        MentorReview review = reviewRepository.findByIdAndMentorId(reviewId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        review.setShowcased(showcased);
        return toReviewResponse(reviewRepository.save(review));
    }

    private void applyPlanFields(
        MentorMentorshipPlan plan,
        String title,
        String description,
        String planType,
        String billingType,
        int priceCents,
        int sessionLimit,
        int durationMinutes,
        String durationLabel,
        boolean premiumSupport,
        boolean popular,
        boolean active,
        int sortOrder,
        List<String> features
    ) {
        plan.setTitle(title.trim());
        plan.setDescription(description);
        plan.setPlanType(planType);
        plan.setBillingType(billingType);
        plan.setPriceCents(priceCents);
        plan.setSessionLimit(sessionLimit);
        plan.setDurationMinutes(durationMinutes);
        plan.setDurationLabel(durationLabel != null && !durationLabel.isBlank()
            ? durationLabel
            : durationMinutes + " min");
        plan.setPremiumSupport(premiumSupport);
        plan.setPopular(popular);
        plan.setActive(active);
        plan.setSortOrder(sortOrder);
        plan.setFeatures(encodeFeatures(features));
    }

    private void clearPopular(UUID mentorId) {
        for (MentorMentorshipPlan p : planRepository.findByMentorIdOrderBySortOrderAsc(mentorId)) {
            if (p.isPopular()) {
                p.setPopular(false);
                planRepository.save(p);
            }
        }
    }

    private MentorMentorshipPlanResponse toPlanResponse(MentorMentorshipPlan plan) {
        return new MentorMentorshipPlanResponse(
            plan.getId(),
            plan.getTitle(),
            plan.getDescription() != null ? plan.getDescription() : "",
            plan.getPlanType(),
            PLAN_TYPE_LABELS.getOrDefault(plan.getPlanType(), plan.getPlanType()),
            plan.getBillingType(),
            BILLING_LABELS.getOrDefault(plan.getBillingType(), plan.getBillingType()),
            plan.getPriceCents(),
            formatMoney(plan.getPriceCents()),
            plan.getSessionLimit(),
            plan.getSessionLimit() <= 0 ? "Unlimited sessions" : plan.getSessionLimit() + " sessions",
            plan.getDurationMinutes(),
            plan.getDurationLabel() != null ? plan.getDurationLabel() : plan.getDurationMinutes() + " min",
            plan.isPremiumSupport(),
            plan.isPopular(),
            plan.isActive(),
            plan.getSortOrder(),
            decodeFeatures(plan.getFeatures())
        );
    }

    private MentorReviewResponse toReviewResponse(MentorReview review) {
        ZoneId zone = ZoneId.systemDefault();
        return new MentorReviewResponse(
            review.getId(),
            review.getLearnerId(),
            review.getLearnerName(),
            review.getRating(),
            review.getReviewText(),
            review.getTopic() != null ? review.getTopic() : "",
            review.getImprovementSuggestion() != null ? review.getImprovementSuggestion() : "",
            review.getMentorReply() != null ? review.getMentorReply() : "",
            review.isShowcased(),
            formatRelative(review.getCreatedAt(), zone),
            review.getCreatedAt(),
            review.getRepliedAt() != null ? formatRelative(review.getRepliedAt(), zone) : ""
        );
    }

    private String encodeFeatures(List<String> features) {
        if (features == null || features.isEmpty()) {
            return "";
        }
        return features.stream()
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .collect(Collectors.joining(FEATURE_DELIM));
    }

    private List<String> decodeFeatures(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split("\\|\\|\\|"))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .toList();
    }

    private void validatePlanType(String type) {
        if (!PLAN_TYPES.contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid plan type");
        }
    }

    private void validateBillingType(String type) {
        if (!BILLING_TYPES.contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid billing type");
        }
    }

    private void requireApprovedMentor(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor workspace access denied");
        }
    }

    private String formatMoney(int cents) {
        return String.format(Locale.US, "$%.2f", cents / 100.0);
    }

    private String formatRelative(Instant instant, ZoneId zone) {
        Duration delta = Duration.between(instant, Instant.now()).abs();
        if (delta.toDays() < 1) {
            return "Today";
        }
        if (delta.toDays() < 7) {
            return delta.toDays() + "d ago";
        }
        if (delta.toDays() < 30) {
            return (delta.toDays() / 7) + "w ago";
        }
        return instant.atZone(zone).format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US));
    }
}
