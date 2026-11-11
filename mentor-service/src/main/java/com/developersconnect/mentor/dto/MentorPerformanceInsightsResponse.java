package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorPerformanceInsightsResponse(
    double studentSatisfactionScore,
    String topPerformingTopic,
    String improvementArea,
    String bookingTrend,
    List<MentorPerformanceInsightResponse> insights
) {}
