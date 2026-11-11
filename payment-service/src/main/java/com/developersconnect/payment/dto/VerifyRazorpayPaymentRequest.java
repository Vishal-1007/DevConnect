package com.developersconnect.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyRazorpayPaymentRequest(
    @NotBlank String orderId,
    @NotBlank String paymentId,
    @NotBlank String signature,
    String description,
    String idempotencyKey
) {}
