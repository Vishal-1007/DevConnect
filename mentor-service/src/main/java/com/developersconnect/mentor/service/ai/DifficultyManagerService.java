package com.developersconnect.mentor.service.ai;

import org.springframework.stereotype.Service;

@Service
public class DifficultyManagerService {

    public static final int MIN_LEVEL = 1;
    public static final int MAX_LEVEL = 5;

    public int initialLevel(String experience) {
        if (experience == null) return 2;
        String exp = experience.toLowerCase();
        if (exp.contains("5+") || exp.contains("5 years") || exp.contains("senior")) return 4;
        if (exp.contains("3-5") || exp.contains("3 years") || exp.contains("4 years")) return 3;
        if (exp.contains("1-3") || exp.contains("1 year") || exp.contains("2 years")) return 2;
        if (exp.contains("fresher") || exp.contains("0")) return 1;
        return 2;
    }

    public int adjustAfterAnswer(int currentLevel, int answerScore) {
        if (answerScore >= 85) return clamp(currentLevel + 1);
        if (answerScore >= 70) return currentLevel;
        if (answerScore < 50) return clamp(currentLevel - 1);
        return currentLevel;
    }

    public String difficultyLabel(int level) {
        return switch (clamp(level)) {
            case 1 -> "Fundamentals";
            case 2 -> "Implementation";
            case 3 -> "Architecture";
            case 4 -> "Advanced / System Design";
            default -> "Expert / Leadership";
        };
    }

    private int clamp(int level) {
        return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
    }
}
