package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TutorialBuilderResponse(
    UUID id,
    String title,
    String description,
    String category,
    String difficulty,
    List<String> tags,
    String courseType,
    int priceCents,
    String creatorType,
    String status,
    Instant publishedAt,
    List<TutorialBuilderSectionResponse> sections
) {}
