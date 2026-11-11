package com.developersconnect.mentor.dto;

import java.util.List;

import com.developersconnect.mentor.dto.BookingAnalyticsResponse.RevenueTrendPoint;

public record MentorDashboardResponse(
    long totalEarningsCents,
    String totalEarningsLabel,
    long monthlyEarningsCents,
    String monthlyEarningsLabel,
    long sessionsCompleted,
    long activeStudents,
    double averageRating,
    long ratingCount,
    double completionRatePct,
    int responseTimeMinutes,
    double earningsGrowthPct,
    double sessionsGrowthPct,
    double studentsGrowthPct,
    long pendingBookingCount,
    String mentorRankLabel,
    List<MentorScheduleItemResponse> todaySchedule,
    List<MentorScheduleItemResponse> upcomingSessions,
    List<MentorPendingRequestResponse> pendingRequests,
    List<MentorStudentSummaryResponse> topStudents,
    List<RevenueTrendPoint> earningsTrend,
    List<RevenueTrendPoint> sessionsTrend,
    double ratingGrowthPct,
    double responseTimeGrowthPct,
    List<String> aiSuggestions,
    MentorStudentProgressHighlight highlightedStudent
) {}
