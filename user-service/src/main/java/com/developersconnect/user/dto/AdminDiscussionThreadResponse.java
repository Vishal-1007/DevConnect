package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record AdminDiscussionThreadResponse(
    UUID id,
    UUID authorId,
    String authorDisplayName,
    String authorRole,
    String title,
    String content,
    String topic,
    Set<String> tags,
    boolean solved,
    boolean pinned,
    int pinnedOrder,
    boolean removed,
    long replyCount,
    Instant createdAt,
    Instant updatedAt
) {
}
