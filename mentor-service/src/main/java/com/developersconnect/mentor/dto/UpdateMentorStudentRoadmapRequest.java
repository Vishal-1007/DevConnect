package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Size;

public record UpdateMentorStudentRoadmapRequest(
    @Size(max = 200) String title,
    @Size(max = 64) String milestone,
    Integer sortOrder,
    @Size(max = 32) String status
) {}
