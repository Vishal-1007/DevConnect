package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.model.AiInterviewQuestion;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class InterviewQuestionGeneratorService {

    private final AdaptiveQuestionComposer composer;
    private final FollowUpDecisionEngine followUpEngine;
    private final AnswerQualityGate qualityGate;

    public InterviewQuestionGeneratorService(
        AdaptiveQuestionComposer composer,
        FollowUpDecisionEngine followUpEngine,
        AnswerQualityGate qualityGate
    ) {
        this.composer = composer;
        this.followUpEngine = followUpEngine;
        this.qualityGate = qualityGate;
    }

    public AdaptiveQuestionComposer.GeneratedQuestion generateNextQuestion(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        List<AiInterviewQuestion> conversation,
        String previousQuestion,
        String previousAnswer
    ) {
        FollowUpDecisionEngine.FollowUpDecision decision;
        if (previousQuestion == null || previousQuestion.isBlank()) {
            String skill = memory.resumeSkills().isEmpty()
                ? candidate.targetRole()
                : memory.resumeSkills().get(0);
            String project = memory.resumeProjects().isEmpty()
                ? "your recent project"
                : memory.resumeProjects().get(0);
            decision = new FollowUpDecisionEngine.FollowUpDecision(
                FollowUpDecisionEngine.FollowUpStrategy.NEW_TOPIC,
                "First question: ask about " + skill + " architecture in " + project + ". One question only.",
                memory.currentDifficulty() != null ? memory.currentDifficulty() : "Medium"
            );
        } else {
            AnswerQualityGate.QualityMetrics quality = qualityGate.analyze(previousAnswer);
            decision = followUpEngine.decide(previousQuestion, previousAnswer, quality, memory);
        }

        return composer.compose(
            candidate,
            memory,
            conversation,
            previousQuestion,
            previousAnswer,
            decision
        );
    }

    public AdaptiveQuestionComposer.GeneratedQuestion generateNextQuestionFast(
        InterviewCandidateContext candidate,
        InterviewMemoryContext memory,
        List<AiInterviewQuestion> conversation,
        String previousQuestion,
        String previousAnswer
    ) {
        AnswerQualityGate.QualityMetrics quality = qualityGate.analyze(previousAnswer);
        FollowUpDecisionEngine.FollowUpDecision decision = followUpEngine.decide(
            previousQuestion, previousAnswer, quality, memory
        );
        return composer.composeFast(candidate, memory, conversation, decision);
    }

    public String cleanQuestion(String text) {
        return composer.cleanQuestion(text);
    }
}
