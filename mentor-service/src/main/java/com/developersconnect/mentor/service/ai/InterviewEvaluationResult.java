package com.developersconnect.mentor.service.ai;

import java.util.List;

public record InterviewEvaluationResult(
    int totalScore,
    String level,
    int technicalAccuracy,
    int answerDepth,
    int experienceMatch,
    int communication,
    int grammar,
    int completeness,
    int confidence,
    List<String> strengths,
    List<String> mistakes,
    List<String> improvements,
    String correctAnswerExample,
    String feedbackSummary
) {
    public static InterviewEvaluationResult empty() {
        return new InterviewEvaluationResult(
            0, "Poor", 0, 0, 0, 0, 0, 0, 0,
            List.of(), List.of("No answer provided"), List.of("Provide a complete answer"),
            "", "No answer was provided."
        );
    }

    public String levelFromScore(int score) {
        if (score <= 30) return "Poor";
        if (score <= 50) return "Needs Improvement";
        if (score <= 70) return "Average";
        if (score <= 85) return "Good";
        return "Excellent";
    }
}
