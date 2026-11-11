package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LearningVideoResponse(
    UUID id,
    String title,
    String description,
    UUID categoryId,
    String categoryName,
    List<String> tags,
    String thumbnailUrl,
    int durationSeconds,
    String visibility,
    int viewCount,
    int likeCount,
    boolean saved,
    Instant createdAt
) {}
