package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMentorFeedbackRequest(
    @Min(1) @Max(5) int rating,
    @NotBlank @Size(max = 2000) String comment,
    @Size(max = 1000) String improvementSuggestion,
    @Size(max = 64) String topic
) {}
