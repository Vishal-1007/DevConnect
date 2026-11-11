package com.developersconnect.user.dto;

import java.util.UUID;

public record LeaderboardEntryResponse(
    int rank,
    UUID userId,
    String displayName,
    String role,
    int points,
    int streak,
    int posts,
    int replies,
    int contributions,
    double averageRating
) {
}
