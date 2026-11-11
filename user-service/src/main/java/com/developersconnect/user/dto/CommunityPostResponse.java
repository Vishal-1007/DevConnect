package com.developersconnect.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record CommunityPostResponse(
    UUID id,
    UUID authorId,
    String authorDisplayName,
    String authorRole,
    String content,
    String category,
    Set<String> tags,
    long likeCount,
    long commentCount,
    boolean likedByMe,
    boolean savedByMe,
    Instant createdAt,
    String imageUrl,
    CommunityPostAttachmentResponse attachment,
    @JsonProperty("code") CommunityPostCodeResponse codeSnippet,
    CommunityPostPollResponse poll
) {}
