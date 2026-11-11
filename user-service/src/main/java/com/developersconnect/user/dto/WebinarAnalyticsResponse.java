package com.developersconnect.user.dto;

public record WebinarAnalyticsResponse(
    long totalWebinars,
    long upcomingWebinars,
    long liveWebinars,
    long pendingHostApprovals,
    long totalRegistrations,
    long totalAttended,
    long cancelledWebinars
) {
}
