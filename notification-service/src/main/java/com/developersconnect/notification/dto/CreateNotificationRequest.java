package com.developersconnect.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateNotificationRequest(
    @NotNull UUID userId,
    @NotBlank @Size(max = 64) String type,
    @NotBlank @Size(max = 255) String title,
    @NotBlank @Size(max = 2000) String body
) {
}
