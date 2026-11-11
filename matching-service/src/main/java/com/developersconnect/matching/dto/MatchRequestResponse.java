package com.developersconnect.matching.dto;

import java.time.Instant;
import java.util.UUID;

public record MatchRequestResponse(
    UUID id,
    UUID requesterId,
    String status,
    String criteria,
    Instant createdAt,
    Instant updatedAt
) {
}
