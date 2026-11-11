package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LearningResourceResponse(
    UUID id,
    String title,
    String description,
    UUID categoryId,
    String categoryName,
    List<String> tags,
    String difficulty,
    String fileType,
    String thumbnailUrl,
    String visibility,
    int downloadCount,
    int viewCount,
    boolean saved,
    Instant createdAt
) {}
