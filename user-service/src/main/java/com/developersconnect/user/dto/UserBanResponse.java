package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserBanResponse(
    UUID id,
    UUID accountId,
    String username,
    String banType,
    String banTypeLabel,
    String reason,
    String bannedByUsername,
    UUID sourceReportId,
    Instant bannedAt,
    Instant expiresAt,
    Instant restoredAt,
    String restoreNote,
    boolean active,
    int offenseCount,
    boolean repeatedOffender,
    String durationLabel
) {}
