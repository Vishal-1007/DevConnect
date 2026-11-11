package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record WalletTransactionResponse(
    UUID id,
    long amountCents,
    String type,
    String description,
    UUID callId,
    Instant createdAt
) {}
