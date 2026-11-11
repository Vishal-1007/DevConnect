package com.developersconnect.chat.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
    UUID id,
    UUID conversationId,
    UUID senderId,
    String content,
    Instant createdAt
) {
}
