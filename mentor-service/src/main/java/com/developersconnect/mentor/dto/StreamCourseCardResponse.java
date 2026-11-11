package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StreamCourseCardResponse(
    UUID id,
    UUID mentorId,
    String mentorDisplayName,
    String creatorType,
    String category,
    String title,
    String description,
    String thumbnailUrl,
    String pricingType,
    String currency,
    int priceCents,
    Integer discountPriceCents,
    String difficulty,
    List<String> tags,
    double averageRating,
    int ratingCount,
    int enrolledCount,
    int likeCount,
    int totalLessons,
    int totalDurationSeconds,
    Instant publishedAt,
    String status,
    boolean purchased,
    boolean saved,
    boolean liked,
    int watchProgressPercent
) {}
