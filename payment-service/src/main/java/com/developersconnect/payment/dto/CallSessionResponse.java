package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record CallSessionResponse(
    UUID id,
    UUID userId,
    UUID mentorId,
    String callType,
    Instant startTime,
    Instant endTime,
    long durationSeconds,
    long amountDeductedCents,
    long mentorEarningCents,
    long platformCommissionCents,
    long pricePerMinuteCents,
    long minutesBilled,
    String status,
    long walletBalanceCents,
    boolean lowBalanceWarning,
    Integer lowBalanceSecondsRemaining
) {}
