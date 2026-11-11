package com.developersconnect.mentor.dto;

import java.util.UUID;

public record MentorInterviewQuestionResponse(
    UUID id,
    String category,
    String categoryLabel,
    String difficulty,
    String difficultyLabel,
    String questionText,
    String followUps,
    String evaluationHints,
    boolean aiGenerated,
    boolean template,
    boolean custom,
    boolean saved,
    String createdAtLabel
) {}
