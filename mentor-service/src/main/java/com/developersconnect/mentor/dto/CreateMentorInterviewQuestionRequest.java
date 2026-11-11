package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMentorInterviewQuestionRequest(
    @NotBlank @Size(max = 32) String category,
    @NotBlank @Size(max = 16) String difficulty,
    @NotBlank @Size(max = 2000) String questionText,
    @Size(max = 5000) String followUps,
    @Size(max = 5000) String evaluationHints,
    boolean template
) {}
