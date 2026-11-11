package com.developersconnect.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    UUID userId,
    String type,
    String title,
    String body,
    Instant readAt,
    Instant createdAt,
    Instant deliveredAt,
    UUID platformNotificationId
) {
}
