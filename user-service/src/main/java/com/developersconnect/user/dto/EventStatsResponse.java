package com.developersconnect.user.dto;

public record EventStatsResponse(
    long upcomingEvents,
    long myRegistrations,
    long onlineEvents,
    long pastEvents
) {
}
