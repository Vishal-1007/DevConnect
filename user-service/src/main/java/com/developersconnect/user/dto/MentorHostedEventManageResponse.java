package com.developersconnect.user.dto;

public record MentorHostedEventManageResponse(
    CommunityEventResponse event,
    int totalRegistrations,
    int revenueInr,
    int mentorEarningsInr
) {
}
