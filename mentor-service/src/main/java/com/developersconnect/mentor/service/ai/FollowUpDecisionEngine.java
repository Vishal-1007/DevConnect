package com.developersconnect.mentor.service.ai;

import org.springframework.stereotype.Component;

@Component
public class FollowUpDecisionEngine {

    public FollowUpDecision decide(
        String previousQuestion,
        String previousAnswer,
        AnswerQualityGate.QualityMetrics quality,
        InterviewMemoryContext memory
    ) {
        if (previousAnswer == null || previousAnswer.isBlank() || "empty".equals(quality.qualityLabel())) {
            return new FollowUpDecision(
                FollowUpStrategy.NEW_TOPIC,
                "Candidate gave no answer. Move to a different resume topic.",
                adjustDifficulty(memory.currentDifficulty(), "easier")
            );
        }

        if ("unknown".equals(quality.qualityLabel())) {
            return new FollowUpDecision(
                FollowUpStrategy.EASIER,
                "Candidate does not know the topic. Ask an easier fundamental question on a different skill.",
                adjustDifficulty(memory.currentDifficulty(), "easier")
            );
        }

        if ("one_liner".equals(quality.qualityLabel()) || "brief".equals(quality.qualityLabel())) {
            String topic = memory.lastTopic() != null ? memory.lastTopic() : "the previous topic";
            if (memory.lastTopicFollowUpCount() < 2) {
                return new FollowUpDecision(
                    FollowUpStrategy.FOLLOW_UP,
                    "Answer was too brief or superficial on " + topic + ". Ask a specific follow-up probing implementation details.",
                    memory.currentDifficulty()
                );
            }
            return new FollowUpDecision(
                FollowUpStrategy.NEW_TOPIC,
                "Maximum follow-ups reached for " + topic + ". Switch to a new resume skill or project.",
                memory.currentDifficulty()
            );
        }

        if (quality.maxAllowedScore() >= 70) {
            return new FollowUpDecision(
                FollowUpStrategy.DEEPER,
                "Strong answer. Increase difficulty — ask scaling, trade-offs, or production concerns.",
                adjustDifficulty(memory.currentDifficulty(), "harder")
            );
        }

        if ("non_technical".equals(quality.qualityLabel())) {
            return new FollowUpDecision(
                FollowUpStrategy.FOLLOW_UP,
                "Answer lacked technical depth. Ask for specific technologies, patterns, or code-level detail.",
                memory.currentDifficulty()
            );
        }

        return new FollowUpDecision(
            FollowUpStrategy.FOLLOW_UP,
            "Answer was partially correct. Ask a clarifying follow-up on what was missing.",
            memory.currentDifficulty()
        );
    }

    private String adjustDifficulty(String current, String direction) {
        int level = switch (current != null ? current : "Medium") {
            case "Easy" -> 1;
            case "Hard" -> 3;
            case "Expert" -> 4;
            default -> 2;
        };
        if ("easier".equals(direction)) level = Math.max(1, level - 1);
        if ("harder".equals(direction)) level = Math.min(4, level + 1);
        return switch (level) {
            case 1 -> "Easy";
            case 3 -> "Hard";
            case 4 -> "Expert";
            default -> "Medium";
        };
    }

    public enum FollowUpStrategy {
        FOLLOW_UP, NEW_TOPIC, EASIER, DEEPER
    }

    public record FollowUpDecision(FollowUpStrategy strategy, String instruction, String nextDifficulty) {}
}
