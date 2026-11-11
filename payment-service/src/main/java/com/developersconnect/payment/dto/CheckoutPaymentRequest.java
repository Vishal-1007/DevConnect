package com.developersconnect.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Single-shot checkout: authorize and capture in one saga run (mock gateway / post-Stripe confirm).
 */
public record CheckoutPaymentRequest(
    @NotNull @Valid CreatePaymentIntentRequest payment,

    @Size(max = 32)
    @Pattern(regexp = "SUCCESS|FAIL", message = "must be SUCCESS or FAIL")
    String simulatedOutcome
) {
}
