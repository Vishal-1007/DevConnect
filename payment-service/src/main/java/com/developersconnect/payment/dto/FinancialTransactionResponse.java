package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record FinancialTransactionResponse(
    UUID id,
    String transactionCode,
    String transactionType,
    String typeLabel,
    UUID payerUserId,
    String payerDisplayName,
    UUID payeeUserId,
    String payeeDisplayName,
    long amountCents,
    String amountLabel,
    String currency,
    long commissionCents,
    String commissionLabel,
    long platformRevenueCents,
    String platformRevenueLabel,
    String status,
    String statusLabel,
    UUID linkedPaymentId,
    String description,
    Instant createdAt,
    String dateLabel
) {
}
