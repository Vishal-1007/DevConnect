package com.developersconnect.payment.dto;

import com.developersconnect.payment.model.RecruiterUsageAction;
import jakarta.validation.constraints.NotNull;

public record ConsumeRecruiterUsageRequest(
    @NotNull RecruiterUsageAction action
) {}
