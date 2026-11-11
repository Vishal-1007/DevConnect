package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record StreamSectionResponse(
    UUID id,
    String title,
    int sortOrder,
    List<StreamLessonResponse> lessons
) {}
