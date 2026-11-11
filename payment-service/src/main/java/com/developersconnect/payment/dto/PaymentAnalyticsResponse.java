package com.developersconnect.payment.dto;

import java.util.List;
import java.util.Map;

public record PaymentAnalyticsResponse(
    long totalRevenueCents,
    String totalRevenueLabel,
    long monthlyRevenueCents,
    String monthlyRevenueLabel,
    double monthlyRevenueGrowthPct,
    long pendingPayoutCents,
    String pendingPayoutLabel,
    long platformCommissionCents,
    String platformCommissionLabel,
    long totalTransactions,
    long failedCount,
    long refundCount,
    long premiumUserCount,
    long activeSubscriptions,
    Map<String, Long> transactionsByType,
    List<RevenueTrendPoint> revenueTrend
) {
    public record RevenueTrendPoint(String label, long amountCents) {}
}
