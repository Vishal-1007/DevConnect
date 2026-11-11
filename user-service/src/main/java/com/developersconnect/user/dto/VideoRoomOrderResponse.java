package com.developersconnect.user.dto;

public record VideoRoomOrderResponse(
    int amount,
    String currency,
    String description,
    String idempotencyKey,
    int priceCents
) {
}
