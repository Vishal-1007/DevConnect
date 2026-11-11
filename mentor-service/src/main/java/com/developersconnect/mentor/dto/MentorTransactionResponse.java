package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorTransactionResponse(
    UUID bookingId,
    String code,
    String description,
    long amountCents,
    String amountLabel,
    Instant date,
    String dateLabel,
    String status
) {}
