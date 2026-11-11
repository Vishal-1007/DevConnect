package com.developersconnect.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddWalletMoneyRequest(
    @NotNull @Min(100) Long amountCents
) {}
