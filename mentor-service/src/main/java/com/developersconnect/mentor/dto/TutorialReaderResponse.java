package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record TutorialReaderResponse(
    UUID id,
    String title,
    String description,
    String category,
    String difficulty,
    List<String> tags,
    String courseType,
    int priceCents,
    String creatorType,
    String creatorName,
    boolean locked,
    boolean purchased,
    boolean saved,
    int totalTopics,
    int completedTopics,
    int progressPercent,
    UUID currentTopicId,
    UUID lastViewedTopicId,
    List<TutorialSectionSummaryResponse> sections,
    TutorialTopicDetailResponse topic
) {}
