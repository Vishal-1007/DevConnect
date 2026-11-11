package com.developersconnect.user.dto;

import java.util.List;

public record BusinessAnalyticsResponse(
    long totalUsers,
    long activeUsers,
    long dau,
    long mau,
    double dauMauRatioPct,
    double retentionRatePct,
    double retentionDeltaPct,
    double mentorEngagementScore,
    long activeMentors,
    long mentorSessions,
    double sessionCompletionRatePct,
    double userGrowthMoMPct,
    double engagementScore,
    long approvedMentorProfiles,
    long totalPosts,
    long totalSessions,
    long completedSessions,
    long liveSessions,
    List<AnalyticsTrendPoint> userGrowthTrend,
    List<AnalyticsTrendPoint> postGrowthTrend,
    List<AnalyticsTrendPoint> sessionGrowthTrend,
    List<AnalyticsTrendPoint> roleDistribution
) {}
