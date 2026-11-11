package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorPayoutHistoryResponse(
    UUID id,
    String payoutCode,
    long amountCents,
    String amountLabel,
    String status,
    String method,
    Instant createdAt,
    Instant completedAt,
    String dateLabel
) {}
