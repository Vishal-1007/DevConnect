package com.developersconnect.mentor.dto;

import java.util.UUID;

public record TutorialSearchResultResponse(
    UUID tutorialId,
    String tutorialTitle,
    UUID sectionId,
    String sectionTitle,
    UUID topicId,
    String topicTitle,
    String snippet
) {}
