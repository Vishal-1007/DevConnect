package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record VideoRoomMessageResponse(
    UUID id,
    UUID roomId,
    UUID authorId,
    String authorDisplayName,
    String content,
    Instant createdAt
) {
}
