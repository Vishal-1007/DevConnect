package com.developersconnect.events.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaymentEventEnvelope(
    UUID eventId,
    PaymentEventType eventType,
    int schemaVersion,
    Instant occurredAt,
    UUID correlationId,
    UUID paymentId,
    UUID userId,
    BigDecimal amount,
    String currency,
    String status,
    String description,
    String failureReason
) {
    public static final int CURRENT_SCHEMA_VERSION = 1;
}
