package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorPayoutResponse(
    UUID id,
    String payoutCode,
    UUID mentorId,
    String mentorDisplayName,
    long amountCents,
    String amountLabel,
    String status,
    String failureReason,
    Instant createdAt,
    Instant completedAt
) {
}
