package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.model.AiInterviewQuestion;
import com.developersconnect.mentor.service.OllamaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AdaptiveQuestionComposer {

    private static final int MAX_LLM_ATTEMPTS = 10;
    private static final int MAX_TOPIC_FOLLOW_UPS = 3;

    private final OllamaService ollama;
    private final InterviewPromptBuilder promptBuilder;
    private final DuplicateQuestionGuard duplicateGuard;
    private final ObjectMapper objectMapper;

    public AdaptiveQuestionComposer(
        OllamaService ollama,
        InterviewPromptBuilder promptBuilder,
        DuplicateQuestionGuard duplicateGuard,
        ObjectMapper objectMapper
    ) {
        this.ollama = ollama;
        this.promptBuilder = promptBuilder;
        this.duplicateGuard = duplicateGuard;
        this.objectMapper = objectMapper;
    }

    public GeneratedQuestion compose(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        List<AiInterviewQuestion> conversation,
        String previousQuestion,
        String previousAnswer,
        FollowUpDecisionEngine.FollowUpDecision decision
    ) {
        String memoryJson = serializeMemory(memory);

        for (int attempt = 0; attempt < MAX_LLM_ATTEMPTS; attempt++) {
            String prompt = promptBuilder.buildAdaptiveQuestionPrompt(
                candidate,
                memoryJson,
                previousQuestion,
                previousAnswer,
                decision,
                attempt > 0
            );
            String raw = ollama.generate(prompt, 0.5 + attempt * 0.04);
            String question = cleanQuestion(raw);

            if (question.isBlank()) continue;

            String topic = duplicateGuard.extractTopic(question);
            if (duplicateGuard.isDuplicate(question, conversation)) continue;
            if (duplicateGuard.exceedsTopicDepth(topic, memory, MAX_TOPIC_FOLLOW_UPS)
                && decision.strategy() != FollowUpDecisionEngine.FollowUpStrategy.NEW_TOPIC) {
                continue;
            }

            return new GeneratedQuestion(question, topic, decision.nextDifficulty());
        }

        return composeDeterministicFallback(candidate, memory, conversation, decision);
    }

    public GeneratedQuestion composeFast(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        List<AiInterviewQuestion> conversation,
        FollowUpDecisionEngine.FollowUpDecision decision
    ) {
        return composeDeterministicFallback(candidate, memory, conversation, decision);
    }

    private GeneratedQuestion composeDeterministicFallback(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        List<AiInterviewQuestion> conversation,
        FollowUpDecisionEngine.FollowUpDecision decision
    ) {
        String skill = pickUncoveredSkill(memory);
        String project = pickUncoveredProject(memory);
        int n = conversation.size();

        String question = switch (decision.strategy()) {
            case FOLLOW_UP -> "Your previous answer was incomplete. Can you explain specifically how the "
                + skill + " layer handles data flow and error handling in your implementation?";
            case EASIER -> "Let's simplify. What is the basic purpose of " + skill + " and where did you use it in your work?";
            case DEEPER -> "Good foundation. How would you scale your " + project + " architecture to handle 1 million concurrent users?";
            case NEW_TOPIC -> "Moving on. Your resume mentions " + skill + ". Walk me through how you applied it in "
                + project + " and one technical challenge you solved.";
        };

        question = question + " [" + (n + 1) + "]";

        String topic = duplicateGuard.extractTopic(question);
        int attempts = 0;
        while (duplicateGuard.isDuplicate(question, conversation) && attempts < 20) {
            skill = memory.resumeSkills().isEmpty() ? candidate.targetRole()
                : memory.resumeSkills().get((n + attempts) % memory.resumeSkills().size());
            project = memory.resumeProjects().isEmpty() ? "your project"
                : memory.resumeProjects().get((n + attempts) % memory.resumeProjects().size());
            question = "Regarding " + skill + " in " + project + ": what design decision are you most proud of and why? [" + (n + attempts) + "]";
            topic = duplicateGuard.extractTopic(question);
            attempts++;
        }

        return new GeneratedQuestion(question, topic, decision.nextDifficulty());
    }

    private String pickUncoveredSkill(InterviewMemoryContext memory) {
        for (String skill : memory.resumeSkills()) {
            if (memory.coveredTopics().stream().noneMatch(t -> t.toLowerCase(Locale.ROOT).contains(skill.toLowerCase(Locale.ROOT)))) {
                return skill;
            }
        }
        if (!memory.resumeSkills().isEmpty()) {
            return memory.resumeSkills().get(memory.askedQuestions().size() % memory.resumeSkills().size());
        }
        return "your core stack";
    }

    private String pickUncoveredProject(InterviewMemoryContext memory) {
        for (String project : memory.resumeProjects()) {
            if (memory.coveredTopics().stream().noneMatch(t -> t.toLowerCase(Locale.ROOT).contains(project.toLowerCase(Locale.ROOT).substring(0, Math.min(8, project.length()))))) {
                return project;
            }
        }
        if (!memory.resumeProjects().isEmpty()) {
            return memory.resumeProjects().get(memory.askedQuestions().size() % memory.resumeProjects().size());
        }
        return "your recent project";
    }

    public String cleanQuestion(String text) {
        String q = text.lines()
            .map(String::trim)
            .filter(l -> !l.isBlank() && !l.startsWith("{") && !l.startsWith("["))
            .findFirst()
            .orElse(text.trim());
        q = q.replaceAll("^(Question:|Q:|Next question:|Good\\.\\s*|Great\\.\\s*|Okay\\.\\s*|Excellent\\.\\s*)", "").trim();
        if (q.length() > 500) q = q.substring(0, 500);
        return q;
    }

    private String serializeMemory(InterviewMemoryContext memory) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(memory);
        } catch (Exception ex) {
            return memory.toString();
        }
    }

    public record GeneratedQuestion(String question, String topic, String difficulty) {}
}
