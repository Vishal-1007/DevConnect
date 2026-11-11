package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminMentorDetailResponse(
    UUID userId,
    String fullName,
    String profileImageUrl,
    String headline,
    String bio,
    String company,
    String designation,
    String experience,
    String location,
    boolean verified,
    double averageRating,
    long ratingCount,
    long sessionsCompleted,
    double responseRate,
    long studentsMentored,
    long revenueGeneratedCents,
    Long audioPricePerMinuteCents,
    Long videoPricePerMinuteCents,
    Long mockInterviewPriceCents,
    Long resumeReviewPriceCents,
    Integer hourlyRateCents,
    List<String> skills,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    String resumeUrl,
    String status,
    Instant createdAt,
    Instant updatedAt
) {}
