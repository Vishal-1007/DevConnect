package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.model.AiInterviewQuestion;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class DuplicateQuestionGuard {

    private static final double SIMILARITY_THRESHOLD = 0.72;

    private static final Map<String, Set<String>> CONCEPT_SYNONYMS = Map.of(
        "dependency injection", Set.of("di", "dependency injection", "inject", "ioc", "inversion of control"),
        "jwt", Set.of("jwt", "json web token", "bearer token", "access token"),
        "spring boot", Set.of("spring boot", "springboot", "spring framework"),
        "react", Set.of("react", "reactjs", "react.js", "jsx"),
        "microservices", Set.of("microservice", "microservices", "distributed system"),
        "database", Set.of("database", "sql", "postgres", "postgresql", "mongodb", "schema", "index"),
        "authentication", Set.of("authentication", "auth", "login", "oauth", "session")
    );

    public boolean isDuplicate(String candidate, List<AiInterviewQuestion> conversation) {
        String normalized = normalize(candidate);
        if (normalized.isBlank()) return true;

        for (AiInterviewQuestion q : conversation) {
            String prior = normalize(q.getQuestion());
            if (prior.equals(normalized)) return true;
            if (similarity(prior, normalized) >= SIMILARITY_THRESHOLD) return true;
            if (sharesConcept(prior, normalized)) return true;
        }
        return false;
    }

    public boolean exceedsTopicDepth(String topic, InterviewMemoryContext memory, int maxFollowUps) {
        if (topic == null || topic.isBlank()) return false;
        String t = topic.toLowerCase(Locale.ROOT);
        long count = memory.askedQuestions().stream()
            .filter(q -> q.topic() != null && q.topic().toLowerCase(Locale.ROOT).equals(t))
            .count();
        return count >= maxFollowUps;
    }

    public String extractTopic(String question) {
        if (question == null) return "general";
        String lower = question.toLowerCase(Locale.ROOT);
        for (String concept : CONCEPT_SYNONYMS.keySet()) {
            Set<String> synonyms = CONCEPT_SYNONYMS.get(concept);
            for (String syn : synonyms) {
                if (lower.contains(syn)) return concept;
            }
        }
        for (String skill : List.of("java", "python", "react", "aws", "docker", "kubernetes", "kafka", "redis")) {
            if (lower.contains(skill)) return skill;
        }
        return "general";
    }

    private boolean sharesConcept(String a, String b) {
        for (Map.Entry<String, Set<String>> entry : CONCEPT_SYNONYMS.entrySet()) {
            boolean aHas = entry.getValue().stream().anyMatch(a::contains);
            boolean bHas = entry.getValue().stream().anyMatch(b::contains);
            if (aHas && bHas) return true;
        }
        return false;
    }

    private String normalize(String question) {
        return question.toLowerCase(Locale.ROOT)
            .replaceAll("\\b(what is|what are|explain|describe|tell me about|walk me through|can you|how does|how do)\\b", "")
            .replaceAll("[^a-z0-9\\s]", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private double similarity(String a, String b) {
        if (a.isBlank() || b.isBlank()) return 0;
        Set<String> wa = new HashSet<>(Arrays.asList(a.split("\\s+")));
        Set<String> wb = new HashSet<>(Arrays.asList(b.split("\\s+")));
        wa.removeIf(w -> w.length() < 3);
        wb.removeIf(w -> w.length() < 3);
        if (wa.isEmpty() || wb.isEmpty()) return 0;
        long overlap = wa.stream().filter(wb::contains).count();
        return (double) overlap / Math.max(wa.size(), wb.size());
    }
}
