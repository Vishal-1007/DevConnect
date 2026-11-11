package com.developersconnect.user.dto;

public record SystemLogAnalyticsResponse(
    long totalLogs,
    long infoCount,
    long warnCount,
    long errorCount,
    long debugCount,
    long loginAttempts,
    long apiErrors,
    long paymentFailures,
    long serverIssues
) {}
