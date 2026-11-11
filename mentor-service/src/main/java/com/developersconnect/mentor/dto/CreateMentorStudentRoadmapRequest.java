package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMentorStudentRoadmapRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 64) String milestone,
    Integer sortOrder
) {}
