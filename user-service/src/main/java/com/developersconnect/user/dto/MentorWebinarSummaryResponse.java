package com.developersconnect.user.dto;

public record MentorWebinarSummaryResponse(
    long totalWebinars,
    long upcomingWebinars,
    long liveWebinars,
    long completedWebinars,
    long totalRegistrations,
    long totalAttended,
    double averageAttendanceRate
) {
}
