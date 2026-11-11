package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record StreamReviewResponse(
    UUID id,
    UUID learnerId,
    String learnerDisplayName,
    int rating,
    String comment,
    Instant createdAt
) {}
