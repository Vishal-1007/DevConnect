package com.developersconnect.payment.dto;

import com.developersconnect.payment.model.PaymentStatus;
import com.developersconnect.payment.model.SagaState;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
    UUID id,
    UUID userId,
    UUID sagaId,
    BigDecimal amount,
    String currency,
    PaymentStatus status,
    String description,
    String paymentMethod,
    String providerReference,
    SagaState sagaState,
    String failureReason,
    String clientSecret,
    String gatewayProvider,
    Instant createdAt,
    Instant updatedAt,
    Instant completedAt
) {
}
