package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record WalletResponse(
    UUID userId,
    long balanceCents,
    String currency,
    String balanceLabel,
    Instant updatedAt
) {}
