package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record TutorialSectionSummaryResponse(
    UUID id,
    String title,
    int orderIndex,
    List<TutorialTopicSummaryResponse> topics
) {}
