package com.developersconnect.payment.dto;

import com.developersconnect.payment.model.RecruiterPlanType;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record AdminUpdateRecruiterSubscriptionRequest(
    @NotNull RecruiterPlanType planType,
    Instant expiryDate
) {}
