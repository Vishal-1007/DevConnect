package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorProfileResponse(
    UUID userId,
    String headline,
    String bio,
    Integer hourlyRateCents,
    boolean verified,
    boolean available,
    double averageRating,
    long ratingCount,
    Instant createdAt,
    Instant updatedAt
) {
}
