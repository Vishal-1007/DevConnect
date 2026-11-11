package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionReportResponse(
    UUID id,
    String reason,
    String details,
    String reporterLabel,
    Instant createdAt
) {
}
