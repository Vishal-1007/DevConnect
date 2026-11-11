package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Size;

public record UpdateMentorInterviewQuestionRequest(
    @Size(max = 32) String category,
    @Size(max = 16) String difficulty,
    @Size(max = 2000) String questionText,
    @Size(max = 5000) String followUps,
    @Size(max = 5000) String evaluationHints,
    Boolean template
) {}
