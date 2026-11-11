package com.developersconnect.mentor.dto;

import java.util.UUID;

public record TutorialTopicDetailResponse(
    UUID id,
    String title,
    UUID sectionId,
    String sectionTitle,
    String htmlContent,
    UUID previousTopicId,
    UUID nextTopicId,
    boolean completed,
    boolean bookmarked
) {}
