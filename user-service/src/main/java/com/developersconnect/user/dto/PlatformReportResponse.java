package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record PlatformReportResponse(
    UUID id,
    String reportCode,
    String category,
    String categoryLabel,
    String targetType,
    String targetTypeLabel,
    UUID targetId,
    String targetSummary,
    UUID targetAccountId,
    UUID reporterId,
    String reporterUsername,
    String details,
    String status,
    String statusLabel,
    String adminAction,
    String adminActionLabel,
    String adminNote,
    String reviewedByUsername,
    Instant createdAt,
    String dateLabel,
    Instant resolvedAt,
    UUID banTargetAccountId
) {
}
