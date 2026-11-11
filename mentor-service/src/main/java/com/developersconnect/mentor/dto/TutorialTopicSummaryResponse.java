package com.developersconnect.mentor.dto;

import java.util.UUID;

public record TutorialTopicSummaryResponse(
    UUID id,
    String title,
    int orderIndex,
    boolean completed,
    boolean bookmarked
) {}
