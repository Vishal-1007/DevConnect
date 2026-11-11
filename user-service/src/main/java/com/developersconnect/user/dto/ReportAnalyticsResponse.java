package com.developersconnect.user.dto;

import java.util.Map;

public record ReportAnalyticsResponse(
    long totalReports,
    long pendingCount,
    long underReviewCount,
    long resolvedCount,
    long escalatedCount,
    Map<String, Long> reportsByCategory
) {
}
