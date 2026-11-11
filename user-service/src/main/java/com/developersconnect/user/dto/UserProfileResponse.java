package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    String username,
    String displayName,
    String bio,
    String avatarUrl,
    String location,
    String role,
    String experienceLevel,
    String learningGoals,
    String githubUrl,
    String linkedinUrl,
    String portfolioUrl,
    Set<String> skills,
    double averageRating,
    long ratingCount,
    Instant createdAt,
    Instant updatedAt
) {
}
