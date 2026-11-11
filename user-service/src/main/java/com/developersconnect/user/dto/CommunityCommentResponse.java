package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityCommentResponse(
    UUID id,
    UUID authorId,
    String authorDisplayName,
    String content,
    UUID parentCommentId,
    Instant createdAt
) {
}
