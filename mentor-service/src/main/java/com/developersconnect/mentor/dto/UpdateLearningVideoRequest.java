package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record UpdateLearningVideoRequest(
    String title,
    String description,
    UUID categoryId,
    List<String> tags,
    int durationSeconds,
    String visibility
) {}
