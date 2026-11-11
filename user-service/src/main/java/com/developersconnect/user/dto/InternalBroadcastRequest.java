package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record InternalBroadcastRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 4000) String message,
    @NotBlank String type,
    @NotBlank String audience,
    UUID createdBy,
    List<UUID> specificUserIds
) {}
