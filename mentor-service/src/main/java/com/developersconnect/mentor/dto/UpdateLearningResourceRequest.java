package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record UpdateLearningResourceRequest(
    String title,
    String description,
    UUID categoryId,
    List<String> tags,
    String difficulty,
    String visibility
) {}
