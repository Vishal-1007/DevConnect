package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorReviewsSummaryResponse(
    double averageRating,
    long totalReviews,
    long showcasedCount,
    int visibilityBoostPct,
    int trustScorePct,
    List<Integer> ratingDistribution,
    List<String> improvementSuggestions,
    List<MentorReviewResponse> reviews,
    List<MentorReviewResponse> testimonials
) {}
