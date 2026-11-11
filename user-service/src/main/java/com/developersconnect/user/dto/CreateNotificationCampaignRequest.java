package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateNotificationCampaignRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 4000) String body,
    @NotBlank String audience,
    @NotBlank String notificationType,
    boolean sendNow,
    Instant scheduledAt,
    List<UUID> specificUserIds
) {}