package com.developersconnect.user.dto;

public record MentorEventDashboardResponse(
    long totalEvents,
    long upcomingEvents,
    long completedEvents,
    long totalStudents,
    long totalRevenueInr,
    long mentorEarningsInr,
    long platformFeeInr,
    long availableBalanceInr
) {
}
