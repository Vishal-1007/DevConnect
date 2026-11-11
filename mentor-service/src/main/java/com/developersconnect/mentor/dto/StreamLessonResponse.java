package com.developersconnect.mentor.dto;

import java.util.UUID;

public record StreamLessonResponse(
    UUID id,
    UUID sectionId,
    String title,
    String description,
    String videoUrl,
    String thumbnailUrl,
    int durationSeconds,
    int sortOrder,
    boolean previewFree,
    boolean locked,
    int progressSeconds,
    boolean completed
) {}
