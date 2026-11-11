package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record SystemLogResponse(
    UUID id,
    String level,
    String levelLabel,
    String service,
    String category,
    String categoryLabel,
    String message,
    String details,
    Instant createdAt,
    String timeLabel
) {}
