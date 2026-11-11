package com.developersconnect.mentor.dto;

import java.util.UUID;

public record TutorialBuilderTopicResponse(
    UUID id,
    String title,
    int orderIndex,
    String htmlContent
) {}
