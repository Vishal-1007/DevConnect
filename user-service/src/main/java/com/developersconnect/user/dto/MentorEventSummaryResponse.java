package com.developersconnect.user.dto;

public record MentorEventSummaryResponse(
    long totalUpcoming,
    long hackathons,
    long workshops,
    long networkingEvents,
    long myParticipations,
    long approvedRoles
) {
}
