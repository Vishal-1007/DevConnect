package com.developersconnect.user.dto;

public record WarningAnalyticsResponse(
    long totalWarnings,
    long unacknowledgedWarnings,
    long highSeverityWarnings
) {}
