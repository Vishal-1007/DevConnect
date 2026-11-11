package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record AdminModeratedPostResponse(
    UUID id,
    UUID authorId,
    String authorDisplayName,
    String authorRole,
    String content,
    String category,
    Set<String> tags,
    long likeCount,
    long commentCount,
    boolean removed,
    boolean flagged,
    boolean autoFlagged,
    String moderationStatus,
    Set<String> moderationFlags,
    String moderationNote,
    Instant flaggedAt,
    Instant createdAt,
    Instant updatedAt
) {}
