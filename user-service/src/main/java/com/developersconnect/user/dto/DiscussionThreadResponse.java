package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record DiscussionThreadResponse(
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
    long replyCount,
    Instant createdAt,
    Instant updatedAt
) {
}
