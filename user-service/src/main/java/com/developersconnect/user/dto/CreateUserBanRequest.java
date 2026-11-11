package com.developersconnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateUserBanRequest(
    @NotNull UUID accountId,
    @NotBlank String username,
    @NotBlank String banType,
    @NotBlank String reason,
    @Min(1) @Max(365) Integer durationDays,
    UUID sourceReportId
) {}
