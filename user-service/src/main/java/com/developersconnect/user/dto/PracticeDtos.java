package com.developersconnect.user.dto;

import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeResponse;

public final class PracticeDtos {

    private PracticeDtos() {}

    public record StartPracticeRequest(
        String problemId,
        String language
    ) {}

    public record SavePracticeCodeRequest(
        String code,
        String language
    ) {}

    public record RunPracticeCodeRequest(
        String problemId,
        String code,
        String language
    ) {}

    public record PracticeAttemptResponse(
        String id,
        String studentId,
        String problemId,
        String code,
        String language,
        String status,
        String mode,
        String startedAt,
        String completedAt
    ) {}

    public record SubmitPracticeRequest(
        String code,
        String language
    ) {}

    public record SubmitPracticeResponse(
        PracticeAttemptResponse attempt,
        RunPairCodeResponse runResult
    ) {}
}
