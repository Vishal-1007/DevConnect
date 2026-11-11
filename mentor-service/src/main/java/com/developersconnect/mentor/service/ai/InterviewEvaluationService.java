package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.model.AiInterviewQuestion;
import com.developersconnect.mentor.service.OllamaService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class InterviewEvaluationService {

    private static final Pattern FILLER = Pattern.compile(
        "\\b(um+|uh+|like|you know|i think|maybe|not sure)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private final OllamaService ollama;
    private final ObjectMapper objectMapper;
    private final AnswerQualityGate qualityGate;

    public InterviewEvaluationService(
        OllamaService ollama,
        ObjectMapper objectMapper,
        AnswerQualityGate qualityGate
    ) {
        this.ollama = ollama;
        this.objectMapper = objectMapper;
        this.qualityGate = qualityGate;
    }

    public InterviewEvaluationResult evaluate(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        String question,
        String answer,
        String questionType
    ) {
        AnswerQualityGate.QualityMetrics quality = qualityGate.analyze(answer);

        if (answer == null || answer.isBlank()) {
            return emptyAnswerResult();
        }

        if ("unknown".equals(quality.qualityLabel())) {
            return dontKnowResult(answer);
        }

        String prompt = buildEvaluationPrompt(candidate, memory, question, answer, questionType, quality);
        String raw = ollama.generate(prompt, 0.2);
        InterviewEvaluationResult parsed = parseEvaluation(raw);
        if (parsed != null) {
            return applyQualityCap(parsed, quality);
        }
        return applyQualityCap(heuristicEvaluation(question, answer, questionType, quality), quality);
    }

    public static InterviewEvaluationResult silentAnswerResult() {
        return new InterviewEvaluationResult(
            0, "Poor", 0, 0, 0, 0, 0, 0, 0,
            List.of(),
            List.of("Candidate did not answer"),
            List.of("Respond to each question with a complete explanation"),
            "",
            "Candidate did not answer. Score: 0/100."
        );
    }

    private InterviewEvaluationResult emptyAnswerResult() {
        return new InterviewEvaluationResult(
            0, "Poor", 0, 0, 0, 0, 0, 0, 0,
            List.of(),
            List.of("No answer provided"),
            List.of("Respond to each question with a complete explanation"),
            "",
            "No answer provided. Score: 0/100."
        );
    }

    private InterviewEvaluationResult dontKnowResult(String answer) {
        return new InterviewEvaluationResult(
            3, "Poor", 2, 0, 0, 1, 0, 0, 0,
            List.of(),
            List.of("Candidate indicated they do not know the answer"),
            List.of("Study this topic before the next interview"),
            "",
            "You said you don't know. Score: 3/100. We need concrete technical explanations."
        );
    }

    private InterviewEvaluationResult applyQualityCap(
        InterviewEvaluationResult result,
        AnswerQualityGate.QualityMetrics quality
    ) {
        int capped = qualityGate.applyCap(result.totalScore(), quality);
        if (capped == result.totalScore()) return result;

        String feedback = result.feedbackSummary()
            + " (Capped to " + capped + " due to " + quality.qualityLabel()
            + " answer — " + quality.wordCount() + " words.)";

        return new InterviewEvaluationResult(
            capped,
            InterviewEvaluationService.levelFromScore(capped),
            Math.min(result.technicalAccuracy(), capped),
            Math.min(result.answerDepth(), capped / 4),
            Math.min(result.experienceMatch(), capped / 6),
            Math.min(result.communication(), capped / 5),
            result.grammar(),
            Math.min(result.completeness(), capped / 5),
            Math.min(result.confidence(), capped / 10),
            result.strengths(),
            result.mistakes(),
            result.improvements(),
            result.correctAnswerExample(),
            feedback
        );
    }

    private String buildEvaluationPrompt(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        String question,
        String answer,
        String questionType,
        AnswerQualityGate.QualityMetrics quality
    ) {
        return InterviewPromptBuilder.STRICT_INTERVIEWER_PROMPT + """

            Score this answer STRICTLY. NO minimum score. One-line generic answers: 5-15 max.

            Return ONLY JSON:
            {
              "technicalCorrectness": 0-40,
              "depthOfExplanation": 0-25,
              "realProjectExperience": 0-15,
              "communication": 0-10,
              "examplesProvided": 0-10,
              "totalScore": sum of above,
              "strengths": [],
              "mistakes": [],
              "improvements": [],
              "feedbackSummary": "honest 2-3 sentences, no fake praise"
            }

            Answer quality detected: %s (%d words, max allowed %d/100)
            Weak areas so far: %s
            Strong areas: %s

            Question: %s
            Answer: %s
            """.formatted(
            quality.qualityLabel(),
            quality.wordCount(),
            quality.maxAllowedScore(),
            memory.weakAreas(),
            memory.strongAreas(),
            question,
            answer
        );
    }

    private InterviewEvaluationResult parseEvaluation(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            String json = extractJson(raw);
            JsonNode node = objectMapper.readTree(json);
            int technical = node.path("technicalCorrectness").asInt(node.path("technicalAccuracy").asInt(-1));
            if (technical < 0) return null;

            int depth = node.path("depthOfExplanation").asInt(node.path("answerDepth").asInt(0));
            int experience = node.path("realProjectExperience").asInt(node.path("experienceMatch").asInt(0));
            int communication = node.path("communication").asInt(0);
            int examples = node.path("examplesProvided").asInt(node.path("completeness").asInt(0));

            int total = technical + depth + experience + communication + examples;
            total = Math.min(100, Math.max(0, node.path("totalScore").asInt(total)));
            if (total == 35 && technical <= 10) return null;

            return new InterviewEvaluationResult(
                total,
                levelFromScore(total),
                clamp(technical, 40),
                clamp(depth, 25),
                clamp(experience, 15),
                clamp(communication, 10),
                0,
                clamp(examples, 10),
                scoreConfidence(node),
                toList(node.path("strengths")),
                toList(node.path("mistakes")),
                toList(node.path("improvements")),
                node.path("correctAnswerExample").asText(""),
                node.path("feedbackSummary").asText("Evaluated.")
            );
        } catch (Exception ex) {
            return null;
        }
    }

    private InterviewEvaluationResult heuristicEvaluation(
        String question,
        String answer,
        String questionType,
        AnswerQualityGate.QualityMetrics quality
    ) {
        String lower = answer.toLowerCase(Locale.ROOT);
        int words = quality.wordCount();

        int technical = scoreTechnical(lower, words, question, questionType);
        int depth = scoreDepth(words, lower);
        int experience = scoreExperience(lower, words);
        int communication = scoreCommunication(words, lower);
        int examples = scoreExamples(lower, words);

        int total = technical + depth + experience + communication + examples;

        List<String> mistakes = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        if ("one_liner".equals(quality.qualityLabel())) {
            mistakes.add("Answer is a one-line generic response without technical depth");
            improvements.add("Explain architecture, layers, and specific implementation details");
            total = Math.min(total, 12);
        }
        if ("brief".equals(quality.qualityLabel())) {
            mistakes.add("Answer is too brief for a technical interview");
            improvements.add("Provide structured explanation with examples from your projects");
            total = Math.min(total, 15);
        }
        if (!quality.hasTechnicalKeywords()) {
            mistakes.add("No technical keywords or concepts mentioned");
            total = Math.min(total, 20);
        }

        String feedback = levelFromScore(total) + " (" + total + "/100). "
            + (mistakes.isEmpty() ? "Add more production-level detail." : String.join("; ", mistakes));

        return new InterviewEvaluationResult(
            total, levelFromScore(total),
            technical, depth, experience, communication, 0, examples,
            Math.max(0, 10 - countFillers(answer)),
            total >= 60 ? List.of("Addressed the question") : List.of(),
            mistakes.isEmpty() ? List.of("Insufficient technical depth") : mistakes,
            improvements.isEmpty() ? List.of("Study core concepts and practice structured answers") : improvements,
            "",
            feedback
        );
    }

    private int scoreTechnical(String lower, int words, String question, String questionType) {
        if (words < 5) return 2;
        if ("HR".equals(questionType)) return Math.min(35, 10 + words);
        int score = 5;
        if (lower.contains("because") || lower.contains("using") || lower.contains("implement")) score += 10;
        if (lower.contains("controller") || lower.contains("service") || lower.contains("repository")) score += 8;
        if (words >= 30) score += 8;
        if (question != null && question.toLowerCase(Locale.ROOT).contains("jwt")
            && lower.contains("session") && !lower.contains("claim")) {
            score = Math.min(score, 8);
        }
        return Math.min(40, score);
    }

    private int scoreDepth(int words, String lower) {
        if (words < 10) return 2;
        if (words < 25) return 8;
        if (words < 50) return 15;
        if (lower.contains("trade") || lower.contains("scale") || lower.contains("optim")) return 22;
        return 18;
    }

    private int scoreExperience(String lower, int words) {
        if (words < 15) return 2;
        if (lower.contains("project") || lower.contains("production") || lower.contains("deploy")) return 12;
        if (lower.contains("team") || lower.contains("worked")) return 8;
        return 4;
    }

    private int scoreCommunication(int words, String lower) {
        int score = 3;
        if (lower.contains("first") || lower.contains("then") || lower.contains("finally")) score += 3;
        if (words >= 20) score += 2;
        return Math.min(10, score);
    }

    private int scoreExamples(String lower, int words) {
        if (words < 10) return 1;
        if (lower.contains("example") || lower.contains("for instance") || lower.contains("in my")) return 8;
        if (words >= 25) return 5;
        return 2;
    }

    private int scoreConfidence(JsonNode node) {
        return clamp(node.path("confidence").asInt(5), 10);
    }

    private int countFillers(String answer) {
        int n = 0;
        var m = FILLER.matcher(answer);
        while (m.find()) n++;
        return n;
    }

    public static String levelFromScore(int score) {
        if (score <= 15) return "Poor";
        if (score <= 35) return "Needs Improvement";
        if (score <= 55) return "Average";
        if (score <= 75) return "Good";
        if (score <= 88) return "Excellent";
        return "Strong Hire";
    }

    public static String hiringLevelFromScore(int score) {
        if (score >= 80) return "Strong Hire";
        if (score >= 65) return "Hire";
        if (score >= 45) return "Needs Improvement";
        return "No Hire";
    }

    private int clamp(int value, int max) {
        return Math.max(0, Math.min(max, value));
    }

    private List<String> toList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node.isArray()) node.forEach(n -> list.add(n.asText()));
        return list;
    }

    private String extractJson(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) return raw.substring(start, end + 1);
        return raw;
    }
}
