package com.developersconnect.mentor.dto;

public record MentorMarketplaceEarningsResponse(
    long totalRevenueCents,
    long platformShareCents,
    long mentorEarningsCents,
    long completedCalls,
    long activeCalls
) {}
