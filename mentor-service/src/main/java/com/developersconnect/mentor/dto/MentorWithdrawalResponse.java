package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorWithdrawalResponse(
    UUID id,
    String withdrawalCode,
    long amountCents,
    String amountLabel,
    String status,
    String note,
    Instant requestedAt,
    Instant processedAt,
    String dateLabel
) {}
