package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record EventPaymentSummaryResponse(
    UUID id,
    UUID eventId,
    String eventTitle,
    String mentorName,
    int ticketsSold,
    int totalAmountInr,
    int mentorShareInr,
    int platformShareInr,
    String status,
    Instant createdAt
) {
}
