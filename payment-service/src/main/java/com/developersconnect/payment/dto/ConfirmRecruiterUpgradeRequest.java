package com.developersconnect.payment.dto;

import com.developersconnect.payment.model.RecruiterPlanType;
import jakarta.validation.constraints.NotNull;

public record ConfirmRecruiterUpgradeRequest(
    @NotNull RecruiterPlanType planType,
    String orderId,
    String paymentId,
    String signature,
    String idempotencyKey
) {}
