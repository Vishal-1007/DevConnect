package com.developersconnect.matching.dto;

import java.time.Instant;
import java.util.UUID;

public record MatchResultResponse(
    UUID id,
    UUID requestId,
    UUID matchedUserId,
    double score,
    Instant createdAt
) {
}
