package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public final class AiInterviewDtos {

    private AiInterviewDtos() {}

    public record ResumeParseResponse(
        String username,
        List<String> skills,
        String experience,
        List<String> projects,
        List<String> companies,
        List<String> technologies,
        String education,
        String rawText
    ) {}

    public record UploadResumeResponse(
        String resumeUrl,
        String username,
        List<String> skills,
        String experience,
        List<String> projects,
        List<String> companies,
        List<String> technologies,
        String education
    ) {}

    public record StartInterviewRequest(
        String candidateName,
        String targetRole,
        String experienceLevel,
        String interviewType,
        String resumeUrl,
        ResumeParseResponse resumeData
    ) {}

    public record SubmitAnswerRequest(String answer, UUID questionId, Integer answerTimeSeconds) {}

    public record QuestionResponse(
        UUID questionId,
        int questionOrder,
        String question,
        String aiFeedback,
        Integer score
    ) {}

    public record InterviewSessionResponse(
        UUID interviewId,
        String status,
        String candidateName,
        String targetRole,
        String experienceLevel,
        String interviewType,
        String introMessage,
        QuestionResponse currentQuestion,
        int totalQuestions,
        boolean completed,
        InterviewResultResponse result,
        String lastAnswerFeedback,
        Integer lastAnswerScore,
        List<String> askedQuestions,
        String nextQuestion,
        Integer questionNumber,
        String transitionMessage
    ) {}

    public record InterviewResultResponse(
        UUID interviewId,
        int overallScore,
        int technicalScore,
        int communicationScore,
        int problemSolvingScore,
        int confidenceScore,
        int grammarScore,
        String hiringLevel,
        List<String> strengths,
        List<String> improvements,
        List<String> recommendedTopics,
        List<QuestionResponse> questions
    ) {}
}
