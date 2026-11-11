package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserWarningResponse(
    UUID id,
    UUID accountId,
    String username,
    String message,
    String reason,
    String severity,
    String severityLabel,
    String issuedByUsername,
    UUID sourceReportId,
    boolean acknowledged,
    Instant acknowledgedAt,
    Instant createdAt
) {}
