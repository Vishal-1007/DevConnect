package com.developersconnect.user.dto;

import java.util.List;

public record EventRevenueAnalyticsResponse(
    long totalRevenueInr,
    long platformEarningsInr,
    long mentorPayoutsInr,
    long totalEvents,
    long approvedEvents,
    long pendingApprovals,
    long totalRegistrations,
    long paidRegistrations,
    List<EventPaymentSummaryResponse> recentTransactions,
    List<EventCategoryStatResponse> topCategories
) {
}
