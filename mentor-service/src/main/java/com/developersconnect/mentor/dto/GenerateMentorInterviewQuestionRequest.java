package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateMentorInterviewQuestionRequest(
    @NotBlank @Size(max = 32) String category,
    @NotBlank @Size(max = 16) String difficulty,
    @Size(max = 120) String topic,
    boolean saveAsTemplate
) {}
