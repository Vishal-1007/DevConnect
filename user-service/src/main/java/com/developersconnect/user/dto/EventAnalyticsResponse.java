package com.developersconnect.user.dto;

public record EventAnalyticsResponse(
    long totalEvents,
    long upcomingEvents,
    long pastEvents,
    long cancelledEvents,
    long totalRegistrations
) {
}
