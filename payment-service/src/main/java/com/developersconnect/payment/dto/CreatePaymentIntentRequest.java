package com.developersconnect.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreatePaymentIntentRequest(
    @NotNull @DecimalMin(value = "0.01", message = "must be at least 0.01")
    BigDecimal amount,

    @NotBlank @Size(min = 3, max = 3)
    @Pattern(regexp = "[A-Z]{3}", message = "must be a 3-letter ISO currency code")
    String currency,

    @NotBlank @Size(max = 500)
    String description,

    /** Preferred: CARD, UPI, GPAY, BHIM, PAYTM, PHONEPE */
    @Size(max = 32)
    String paymentMode,

    /** Legacy alias for paymentMode */
    @Size(max = 32)
    String paymentMethod,

    @Size(max = 128)
    String idempotencyKey
) {
}
