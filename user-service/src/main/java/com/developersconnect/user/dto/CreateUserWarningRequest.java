package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateUserWarningRequest(
    @NotNull UUID accountId,
    @NotBlank String username,
    String message,
    @NotBlank String reason,
    @NotBlank String severity,
    UUID sourceReportId
) {}
