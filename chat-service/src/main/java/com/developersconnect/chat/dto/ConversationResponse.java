package com.developersconnect.chat.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ConversationResponse(
    UUID id,
    UUID createdBy,
    List<UUID> participants,
    Instant createdAt,
    Instant updatedAt
) {
}
