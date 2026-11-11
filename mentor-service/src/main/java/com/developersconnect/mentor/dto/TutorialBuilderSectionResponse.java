package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record TutorialBuilderSectionResponse(
    UUID id,
    String title,
    int orderIndex,
    List<TutorialBuilderTopicResponse> topics
) {}
