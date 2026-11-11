package com.developersconnect.mentor.service.ai;

import java.util.List;

public record InterviewCandidateContext(
    String name,
    String targetRole,
    String experience,
    String interviewType,
    List<String> skills,
    List<String> projects,
    List<String> technologies,
    List<String> companies,
    String education,
    String resumeText,
    String resumeSummary,
    List<String> previousQuestions,
    List<String> previousAnswers,
    int difficultyLevel,
    int questionNumber,
    int maxQuestions
) {
    public String skillsLine() {
        return String.join(", ", skills != null ? skills : List.of());
    }

    public String projectsLine() {
        return String.join(", ", projects != null ? projects : List.of());
    }

    public String technologiesLine() {
        return String.join(", ", technologies != null ? technologies : List.of());
    }
}
