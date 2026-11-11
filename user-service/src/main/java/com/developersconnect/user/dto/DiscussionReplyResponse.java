package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record DiscussionReplyResponse(
    UUID id,
    UUID threadId,
    UUID authorId,
    String authorDisplayName,
    String content,
    boolean acceptedAnswer,
    Instant createdAt
) {
}
