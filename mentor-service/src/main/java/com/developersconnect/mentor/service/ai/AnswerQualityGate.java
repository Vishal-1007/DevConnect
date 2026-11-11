package com.developersconnect.mentor.service.ai;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AnswerQualityGate {

    private static final Pattern TECH_KEYWORDS = Pattern.compile(
        "\\b(api|rest|jwt|spring|bean|controller|service|repository|database|sql|react|"
            + "component|hook|state|microservice|docker|kubernetes|aws|cache|index|"
            + "transaction|authentication|authorization|token|architecture|deploy|"
            + "algorithm|complexity|thread|async|kafka|redis|postgres|mongodb|"
            + "interface|class|method|function|implement|design|scale|load|"
            + "middleware|endpoint|schema|migration|test|debug|optimize)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DONT_KNOW = Pattern.compile(
        "\\b(i don'?t know|no idea|not sure|cannot answer|skip|pass)\\b",
        Pattern.CASE_INSENSITIVE
    );

    public QualityMetrics analyze(String answer) {
        if (answer == null || answer.isBlank()) {
            return new QualityMetrics(0, 0, false, 0, "empty");
        }
        String trimmed = answer.trim();
        int wordCount = trimmed.isBlank() ? 0 : trimmed.split("\\s+").length;
        int keywordCount = countKeywords(trimmed);
        boolean hasTechnical = keywordCount > 0;
        int maxScore = computeMaxScore(trimmed, wordCount, hasTechnical);
        String quality = classify(wordCount, hasTechnical, trimmed);
        return new QualityMetrics(wordCount, keywordCount, hasTechnical, maxScore, quality);
    }

    public int applyCap(int rawScore, QualityMetrics metrics) {
        return Math.min(rawScore, metrics.maxAllowedScore());
    }

    private int computeMaxScore(String answer, int wordCount, boolean hasTechnical) {
        if (DONT_KNOW.matcher(answer).find()) return 5;
        if (wordCount < 5) return 5;
        if (wordCount < 15) return 15;
        if (!hasTechnical) return 20;
        return 100;
    }

    private String classify(int wordCount, boolean hasTechnical, String answer) {
        if (DONT_KNOW.matcher(answer).find()) return "unknown";
        if (wordCount < 5) return "one_liner";
        if (wordCount < 15) return "brief";
        if (!hasTechnical) return "non_technical";
        if (wordCount < 40) return "basic";
        if (wordCount < 80) return "good";
        return "production";
    }

    private int countKeywords(String text) {
        int count = 0;
        var m = TECH_KEYWORDS.matcher(text);
        Set<String> seen = new java.util.HashSet<>();
        while (m.find()) {
            if (seen.add(m.group().toLowerCase(Locale.ROOT))) count++;
        }
        return count;
    }

    public record QualityMetrics(
        int wordCount,
        int technicalKeywordCount,
        boolean hasTechnicalKeywords,
        int maxAllowedScore,
        String qualityLabel
    ) {}
}
