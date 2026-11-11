package com.developersconnect.user.dto;

public record EventOrderResponse(
    int amountInr,
    String currency,
    String description,
    String idempotencyKey,
    int amountCents
) {
}
