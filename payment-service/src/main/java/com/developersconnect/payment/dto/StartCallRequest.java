package com.developersconnect.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record StartCallRequest(
    @NotNull UUID mentorId,
    @NotBlank String callType,
    @NotNull Long pricePerMinuteCents
) {}
