package com.developersconnect.mentor.dto;

import java.util.UUID;

public record MentorLeaderboardEntryResponse(
    int rank,
    UUID mentorId,
    String displayName,
    String headline,
    double averageRating,
    long sessionsCompleted,
    int points,
    int streakDays,
    double retentionPct,
    boolean currentUser
) {}
