package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationCampaignResponse(
    UUID id,
    String title,
    String body,
    String audience,
    String audienceLabel,
    String notificationType,
    String notificationTypeLabel,
    String status,
    String statusLabel,
    Instant scheduledAt,
    Instant sentAt,
    String sentAtLabel,
    int recipientCount,
    String createdByUsername,
    Instant createdAt
) {}
