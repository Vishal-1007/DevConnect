package com.developersconnect.user.dto;

import java.util.List;

public record UserStatsResponse(
    int streak,
    int points,
    int rank,
    int posts,
    int replies,
    int contributions,
    int codingSolved,
    int pairSessionsCompleted,
    int practiceSessionsCompleted,
    int avgSessionMinutes,
    List<String> activityTimestamps
) {
}
