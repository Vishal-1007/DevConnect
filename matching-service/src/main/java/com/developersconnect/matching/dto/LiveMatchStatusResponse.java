package com.developersconnect.matching.dto;

import java.time.Instant;
import java.util.UUID;

public record LiveMatchStatusResponse(
    String role,
    String poolStatus,
    boolean liveEnabled,
    UUID assignmentId,
    String assignmentStatus,
    UUID partnerId,
    String partnerRole,
    String criteria,
    Instant expiresAt,
    String message
) {
}
