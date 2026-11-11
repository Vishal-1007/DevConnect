package com.developersconnect.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record NotifyUsersRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 4000) String message,
    @NotBlank String type,
    @NotBlank String audienceType,
    UUID createdBy,
    @NotEmpty List<UUID> userIds
) {}
