package com.developersconnect.user.dto;

import java.util.List;
import java.util.Map;

public final class CodingProblemDtos {

    private CodingProblemDtos() {}

    public record ExampleDto(String input, String output) {}

    public record TestCaseDto(
        String name,
        String input,
        String expected,
        String jsInvoke,
        String pyInvoke,
        String javaInvoke
    ) {}

    public record ProblemSummaryResponse(
        String id,
        String title,
        String description,
        String difficulty,
        String category,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        List<ExampleDto> examples,
        List<String> constraints,
        boolean solved,
        long solvedCount,
        String status,
        String creatorType,
        String createdAt
    ) {}

    public record ProblemDetailResponse(
        String id,
        String title,
        String description,
        String difficulty,
        String category,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        List<ExampleDto> examples,
        List<String> constraints,
        List<String> hints,
        Map<String, String> starterCode,
        List<TestCaseDto> testCases,
        String solution,
        boolean solved,
        long solvedCount,
        String status,
        String creatorType,
        String createdAt,
        String updatedAt
    ) {}

    public record ProblemStatsResponse(
        long totalProblems,
        long solvedCount
    ) {}

    public record CreateProblemRequest(
        String title,
        String description,
        String category,
        String difficulty,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        Map<String, String> starterCode,
        List<TestCaseDto> testCases,
        String solution,
        List<String> hints,
        List<String> constraints,
        List<ExampleDto> examples,
        String status
    ) {}

    public record UpdateProblemRequest(
        String title,
        String description,
        String category,
        String difficulty,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        Map<String, String> starterCode,
        List<TestCaseDto> testCases,
        String solution,
        List<String> hints,
        List<String> constraints,
        List<ExampleDto> examples,
        String status
    ) {}

    public record UpdateStatusRequest(String status) {}

    public record SubmitAttemptRequest(
        String code,
        String language,
        boolean passed
    ) {}

    public record AttemptResponse(
        String id,
        String problemId,
        String status,
        String language,
        String submittedAt
    ) {}
}
