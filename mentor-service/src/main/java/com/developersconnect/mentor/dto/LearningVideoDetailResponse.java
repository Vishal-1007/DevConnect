package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LearningVideoDetailResponse(
    UUID id,
    String title,
    String description,
    UUID categoryId,
    String categoryName,
    List<String> tags,
    String videoUrl,
    String thumbnailUrl,
    int durationSeconds,
    String visibility,
    int viewCount,
    int likeCount,
    boolean saved,
    Instant createdAt,
    List<LearningVideoResponse> related
) {}
