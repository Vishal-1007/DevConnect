package com.developersconnect.payment.dto;

public record PaymentModeOptionResponse(
    String id,
    String label,
    String description,
    String category,
    boolean requiresCardDetails,
    boolean availableWithStripe
) {
}
