package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorAnalyticsResponse(
    long sessionsCompleted,
    double sessionsGrowthPct,
    double completionRatePct,
    double completionRateGrowthPct,
    int averageDurationMinutes,
    double durationChangePct,
    double studentRetentionPct,
    double retentionGrowthPct,
    double averageRating,
    long fiveStarSessions,
    long repeatStudents,
    int responseTimeMinutes,
    double noShowRatePct,
    List<Integer> sessionsByMonth,
    List<MentorTopicPerformanceResponse> topicPerformance,
    List<String> teachingTips
) {}
