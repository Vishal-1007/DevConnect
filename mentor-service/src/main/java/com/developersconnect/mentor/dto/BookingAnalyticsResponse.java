package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.Map;

public record BookingAnalyticsResponse(
    long totalBookings,
    long confirmedCount,
    long pendingCount,
    long scheduledCount,
    long completedCount,
    long cancelledCount,
    long refundRequestedCount,
    long refundedCount,
    long revenueCents,
    String revenueLabel,
    long refundedCents,
    String refundedLabel,
    long pendingRefundCents,
    String pendingRefundLabel,
    Map<String, Long> bookingsByStatus,
    List<RevenueTrendPoint> revenueTrend
) {
    public record RevenueTrendPoint(String label, long amountCents) {}
}
