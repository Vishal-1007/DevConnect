package com.developersconnect.payment.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ConfirmPaymentRequest(
    @Size(max = 32)
    @Pattern(regexp = "SUCCESS|FAIL", message = "must be SUCCESS or FAIL")
    String simulatedOutcome
) {
}
