package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.service.OllamaService;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class AnswerAnalyzerService {

    private static final Pattern FILLER = Pattern.compile(
        "\\b(um+|uh+|like|you know|i think|maybe|not sure|sort of|kind of)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private final OllamaService ollama;

    public AnswerAnalyzerService(OllamaService ollama) {
        this.ollama = ollama;
    }

    public String analyzeForFollowUp(String question, String answer, InterviewCandidateContext candidate) {
        if (answer == null || answer.isBlank()) {
            return "Candidate gave no substantive answer. Ask a simpler foundational question on the same topic.";
        }

        String heuristic = buildHeuristicAnalysis(question, answer);
        String llm = requestBriefAnalysis(question, answer, candidate);
        if (llm != null && !llm.isBlank()) {
            return heuristic + "\nAI analysis: " + llm.trim();
        }
        return heuristic;
    }

    private String buildHeuristicAnalysis(String question, String answer) {
        String lower = answer.toLowerCase(Locale.ROOT);
        int words = answer.trim().split("\\s+").length;
        StringBuilder sb = new StringBuilder();

        if (words < 12) {
            sb.append("Answer was brief. Candidate may know basics but missed depth. ");
        } else if (words >= 50) {
            sb.append("Answer was detailed. Probe edge cases or production trade-offs. ");
        } else {
            sb.append("Answer covered fundamentals. Ask a follow-up to test deeper understanding. ");
        }

        if (lower.contains("don't know") || lower.contains("not sure") || lower.contains("no idea")) {
            sb.append("Candidate expressed uncertainty — simplify or ask a related fundamental. ");
        }
        if (FILLER.matcher(answer).find()) {
            sb.append("Filler words detected — confidence may be low. ");
        }
        if (lower.contains("because") || lower.contains("for example") || lower.contains("implemented")) {
            sb.append("Candidate used structured reasoning — increase difficulty on next question. ");
        }
        if (question != null && question.toLowerCase(Locale.ROOT).contains("spring")
            && !lower.contains("inject") && !lower.contains("bean") && !lower.contains("component")) {
            sb.append("Spring question answered without IoC/DI specifics — follow up on @Component vs @Service. ");
        }
        if (question != null && question.toLowerCase(Locale.ROOT).contains("jwt")
            && !lower.contains("claim") && !lower.contains("token")) {
            sb.append("JWT answer may confuse session storage — clarify claims vs server sessions. ");
        }

        return sb.toString().trim();
    }

    private String requestBriefAnalysis(String question, String answer, InterviewCandidateContext candidate) {
        String prompt = """
            Analyze this interview answer in 2 sentences max. What did the candidate get right or wrong?
            What specific follow-up topic should the next question target?
            Do NOT repeat the question. Be specific.

            Role: %s
            Question: %s
            Answer: %s
            """.formatted(candidate.targetRole(), question, answer);

        String raw = ollama.generate(prompt, 0.4);
        if (raw.isBlank() || raw.length() > 400) {
            return raw.isBlank() ? null : raw.substring(0, 400);
        }
        return raw;
    }
}
