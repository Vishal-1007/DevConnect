package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorEarningsResponse(
    long totalEarningsCents,
    String totalEarningsLabel,
    long monthlyRevenueCents,
    String monthlyRevenueLabel,
    long sessionRevenueCents,
    String sessionRevenueLabel,
    long pendingPayoutCents,
    String pendingPayoutLabel,
    long platformFeeCents,
    String platformFeeLabel,
    double commissionRatePct,
    long netEarningsCents,
    String netEarningsLabel,
    double revenueGrowthPct,
    List<BookingAnalyticsResponse.RevenueTrendPoint> revenueTrend,
    List<MentorTransactionResponse> transactions,
    List<MentorPayoutHistoryResponse> payoutHistory,
    List<MentorWithdrawalResponse> withdrawalRequests,
    MentorPaymentAnalyticsResponse paymentAnalytics
) {}
