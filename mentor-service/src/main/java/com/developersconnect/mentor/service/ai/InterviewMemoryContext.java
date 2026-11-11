package com.developersconnect.mentor.service.ai;

import java.util.ArrayList;
import java.util.List;

public record InterviewMemoryContext(
    List<String> resumeSkills,
    List<String> resumeProjects,
    List<String> resumeTechnologies,
    List<AskedQuestionEntry> askedQuestions,
    List<AnswerEntry> answers,
    List<String> coveredTopics,
    List<String> weakAreas,
    List<String> strongAreas,
    String currentDifficulty,
    String lastTopic,
    int lastTopicFollowUpCount
) {
    public static InterviewMemoryContext empty(List<String> skills, List<String> projects, List<String> technologies) {
        return new InterviewMemoryContext(
            skills != null ? skills : List.of(),
            projects != null ? projects : List.of(),
            technologies != null ? technologies : List.of(),
            new ArrayList<>(),
            new ArrayList<>(),
            new ArrayList<>(),
            new ArrayList<>(),
            new ArrayList<>(),
            "Medium",
            null,
            0
        );
    }

    public record AskedQuestionEntry(String question, String topic, String difficulty) {}

    public record AnswerEntry(String answer, int score, String feedback, String topic) {}

    public InterviewMemoryContext withDifficulty(String difficulty) {
        return new InterviewMemoryContext(
            resumeSkills,
            resumeProjects,
            resumeTechnologies,
            askedQuestions,
            answers,
            coveredTopics,
            weakAreas,
            strongAreas,
            difficulty,
            lastTopic,
            lastTopicFollowUpCount
        );
    }
}
