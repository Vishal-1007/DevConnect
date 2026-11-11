package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StreamCourseDetailResponse(
    UUID id,
    UUID mentorId,
    String mentorDisplayName,
    String creatorType,
    String category,
    String title,
    String description,
    String thumbnailUrl,
    String bannerUrl,
    String pricingType,
    String currency,
    int priceCents,
    Integer discountPriceCents,
    String difficulty,
    List<String> tags,
    int totalLessons,
    String whatYouLearn,
    String requirements,
    double averageRating,
    int ratingCount,
    int enrolledCount,
    int totalDurationSeconds,
    Instant publishedAt,
    boolean purchased,
    boolean saved,
    boolean followingMentor,
    List<StreamSectionResponse> sections,
    List<StreamReviewResponse> reviews,
    List<StreamCourseCardResponse> relatedCourses
) {
}
