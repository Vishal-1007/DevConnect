package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.Map;

public record MentorFeedbackSummaryResponse(
    double averageRating,
    long totalReviews,
    long totalTestimonials,
    int trustScorePct,
    int visibilityBoostPct,
    Map<String, Long> ratingDistribution,
    List<String> improvementSuggestions,
    List<MentorFeedbackTestimonialResponse> testimonials,
    List<MentorReviewResponse> reviews
) {}
