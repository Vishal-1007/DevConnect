package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorPaymentAnalyticsResponse(
    long sessionRevenueCents,
    String sessionRevenueLabel,
    double commissionRatePct,
    long netEarningsCents,
    String netEarningsLabel,
    long availableBalanceCents,
    String availableBalanceLabel,
    List<MentorPaymentBreakdownResponse> revenueByCategory
) {}
