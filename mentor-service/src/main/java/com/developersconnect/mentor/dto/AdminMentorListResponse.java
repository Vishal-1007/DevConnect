package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminMentorListResponse(
    UUID userId,
    String fullName,
    String profileImageUrl,
    String headline,
    String company,
    String designation,
    String experience,
    boolean verified,
    double averageRating,
    long ratingCount,
    long sessionsCompleted,
    Long audioPricePerMinuteCents,
    Long videoPricePerMinuteCents,
    Integer hourlyRateCents,
    String status,
    Instant createdAt
) {}
