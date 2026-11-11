package com.developersconnect.matching.dto;

import java.time.Instant;
import java.util.UUID;

public record LiveMatchAssignmentResponse(
    UUID id,
    UUID mentorId,
    UUID learnerId,
    String status,
    String criteria,
    Instant expiresAt,
    Instant acceptedAt,
    Instant createdAt
) {
}
