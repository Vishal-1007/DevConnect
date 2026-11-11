package com.developersconnect.mentor.dto;

import java.util.UUID;

public record MentorStudentRoadmapItemResponse(
    UUID id,
    String title,
    String milestone,
    int sortOrder,
    String status
) {}
