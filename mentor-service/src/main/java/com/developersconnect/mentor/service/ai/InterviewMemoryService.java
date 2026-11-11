package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.dto.AiInterviewDtos.ResumeParseResponse;
import com.developersconnect.mentor.model.AiInterview;
import com.developersconnect.mentor.model.AiInterviewQuestion;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class InterviewMemoryService {

    private final DuplicateQuestionGuard duplicateGuard;
    private final ObjectMapper objectMapper;

    public InterviewMemoryService(DuplicateQuestionGuard duplicateGuard, ObjectMapper objectMapper) {
        this.duplicateGuard = duplicateGuard;
        this.objectMapper = objectMapper;
    }

    public InterviewMemoryContext build(AiInterview interview, ResumeParseResponse resume, List<AiInterviewQuestion> questions) {
        if (interview.getContextJson() != null && !interview.getContextJson().isBlank()) {
            try {
                return objectMapper.readValue(interview.getContextJson(), InterviewMemoryContext.class);
            } catch (Exception ignored) {
                /* rebuild from questions */
            }
        }
        return rebuildFromQuestions(resume, questions, difficultyLabel(interview.getDifficultyLevel()));
    }

    public InterviewMemoryContext rebuildFromQuestions(
        ResumeParseResponse resume,
        List<AiInterviewQuestion> questions,
        String difficulty
    ) {
        List<InterviewMemoryContext.AskedQuestionEntry> asked = new ArrayList<>();
        List<InterviewMemoryContext.AnswerEntry> answers = new ArrayList<>();
        Set<String> covered = new LinkedHashSet<>();
        List<String> weak = new ArrayList<>();
        List<String> strong = new ArrayList<>();
        String lastTopic = null;
        int followUpCount = 0;

        for (AiInterviewQuestion q : questions) {
            String topic = q.getTopic() != null ? q.getTopic() : duplicateGuard.extractTopic(q.getQuestion());
            String diff = q.getDifficulty() != null ? q.getDifficulty() : difficulty;
            asked.add(new InterviewMemoryContext.AskedQuestionEntry(q.getQuestion(), topic, diff));
            covered.add(topic);

            if (topic.equals(lastTopic)) {
                followUpCount++;
            } else {
                lastTopic = topic;
                followUpCount = 1;
            }

            if (q.getUserAnswer() != null) {
                int score = q.getScore() != null ? q.getScore() : 0;
                answers.add(new InterviewMemoryContext.AnswerEntry(
                    q.getUserAnswer(), score,
                    q.getAiFeedback() != null ? q.getAiFeedback() : "",
                    topic
                ));
                if (score >= 65) strong.add(topic);
                if (score < 40) weak.add(topic);
            }
        }

        return new InterviewMemoryContext(
            resume.skills(),
            resume.projects(),
            resume.technologies(),
            asked,
            answers,
            new ArrayList<>(covered),
            weak.stream().distinct().toList(),
            strong.stream().distinct().toList(),
            difficulty,
            lastTopic,
            followUpCount
        );
    }

    public InterviewMemoryContext afterAnswer(
        InterviewMemoryContext memory,
        String question,
        String topic,
        String difficulty,
        String answer,
        int score,
        String feedback
    ) {
        List<InterviewMemoryContext.AskedQuestionEntry> asked = new ArrayList<>(memory.askedQuestions());
        List<InterviewMemoryContext.AnswerEntry> answers = new ArrayList<>(memory.answers());
        Set<String> covered = new LinkedHashSet<>(memory.coveredTopics());
        List<String> weak = new ArrayList<>(memory.weakAreas());
        List<String> strong = new ArrayList<>(memory.strongAreas());

        asked.add(new InterviewMemoryContext.AskedQuestionEntry(question, topic, difficulty));
        covered.add(topic);
        answers.add(new InterviewMemoryContext.AnswerEntry(answer != null ? answer : "", score, feedback, topic));

        if (score >= 65 && !strong.contains(topic)) strong.add(topic);
        if (score < 40 && !weak.contains(topic)) weak.add(topic);

        int followUpCount = topic.equals(memory.lastTopic()) ? memory.lastTopicFollowUpCount() + 1 : 1;

        return new InterviewMemoryContext(
            memory.resumeSkills(),
            memory.resumeProjects(),
            memory.resumeTechnologies(),
            asked,
            answers,
            new ArrayList<>(covered),
            weak,
            strong,
            difficulty,
            topic,
            followUpCount
        );
    }

    public String serialize(InterviewMemoryContext memory) {
        try {
            return objectMapper.writeValueAsString(memory);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private String difficultyLabel(Integer level) {
        if (level == null) return "Medium";
        return switch (level) {
            case 1 -> "Easy";
            case 3 -> "Hard";
            case 4, 5 -> "Expert";
            default -> "Medium";
        };
    }
}
