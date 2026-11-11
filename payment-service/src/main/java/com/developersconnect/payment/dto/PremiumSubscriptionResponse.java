package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record PremiumSubscriptionResponse(
    UUID id,
    UUID userId,
    String username,
    String planId,
    String planName,
    long amountCents,
    String amountLabel,
    String status,
    boolean premium,
    Instant startedAt,
    Instant renewsAt
) {
}
