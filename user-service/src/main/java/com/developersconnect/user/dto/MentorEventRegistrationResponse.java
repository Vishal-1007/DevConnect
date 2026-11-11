package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorEventRegistrationResponse(
    UUID userId,
    String username,
    String displayName,
    Instant registeredAt,
    String paymentStatus,
    int amountPaidInr
) {
}
