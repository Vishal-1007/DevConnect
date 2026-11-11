package com.developersconnect.user.dto;

import java.util.List;
import java.util.UUID;

public final class PairProgrammingDtos {

    private PairProgrammingDtos() {}

    public record StartPairSessionRequest(
        UUID problemId,
        String language,
        String role,
        UUID assignmentId,
        UUID partnerId,
        String partnerName,
        String partnerRole,
        boolean allowMentorEdit
    ) {}

    public record JoinPairSessionRequest(String sessionCode) {}

    public record SavePairCodeRequest(String code, String language) {}

    public record RunPairCodeRequest(String code, String language, String problemId) {}

    public record SendPairChatRequest(String message, String messageType) {}

    public record SavePairNoteRequest(String content) {}

    public record SaveWhiteboardRequest(String jsonData) {}

    public record StopRecordingRequest(String videoUrl) {}

    public record PairParticipantResponse(
        UUID id,
        UUID userId,
        String displayName,
        String role,
        boolean micEnabled,
        boolean cameraEnabled
    ) {}

    public record PairChatMessageResponse(
        UUID id,
        UUID senderId,
        String senderName,
        String message,
        String messageType,
        String createdAt
    ) {}

    public record TestCaseResultResponse(
        String name,
        String input,
        String expectedOutput,
        String actualOutput,
        boolean passed,
        long executionMs
    ) {}

    public record RunPairCodeResponse(
        boolean allPassed,
        String stdout,
        String stderr,
        long executionMs,
        long memoryKb,
        List<TestCaseResultResponse> testCases
    ) {}

    public record PairSessionResponse(
        UUID id,
        String sessionCode,
        UUID hostId,
        UUID mentorId,
        UUID assignmentId,
        String problemId,
        String problemTitle,
        String problemDescription,
        String language,
        String difficulty,
        String status,
        String currentCode,
        String hostRole,
        boolean allowMentorEdit,
        String mode,
        String startedAt,
        String endedAt,
        List<PairParticipantResponse> participants,
        String noteContent,
        String whiteboardJson,
        List<String> hints,
        List<String> constraints,
        List<ResourceLinkResponse> resources
    ) {}

    public record ResourceLinkResponse(String title, String url) {}

    public record SessionSummaryResponse(
        UUID sessionId,
        long durationSeconds,
        String problemTitle,
        String language,
        boolean problemSolved,
        int codeQualityScore,
        int pointsEarned,
        String mentorFeedback,
        List<String> strengths,
        List<String> weaknesses,
        List<String> improvementAreas
    ) {}
}
