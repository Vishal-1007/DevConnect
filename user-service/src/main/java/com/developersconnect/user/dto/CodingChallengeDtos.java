package com.developersconnect.user.dto;

import com.developersconnect.user.dto.CodingProblemDtos.TestCaseDto;
import java.util.List;
import java.util.Map;

public final class CodingChallengeDtos {

    private CodingChallengeDtos() {}

    public record ChallengeSummaryResponse(
        String id,
        String title,
        String description,
        String difficulty,
        String category,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        boolean solved,
        String creatorType,
        String createdAt
    ) {}

    public record ChallengeDetailResponse(
        String id,
        String title,
        String description,
        String difficulty,
        String category,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        Map<String, String> starterCode,
        List<TestCaseDto> testCases,
        String solution,
        boolean solved,
        String creatorType,
        String createdAt,
        String updatedAt
    ) {}

    public record ChallengeStatsResponse(
        long totalProblems,
        long solvedCount
    ) {}

    public record CreateChallengeRequest(
        String title,
        String description,
        String difficulty,
        String category,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        Map<String, String> starterCode,
        List<TestCaseDto> testCases,
        String solution,
        Boolean published
    ) {}

    public record UpdateChallengeRequest(
        String title,
        String description,
        String difficulty,
        String category,
        List<String> languages,
        List<String> tags,
        List<String> companies,
        Map<String, String> starterCode,
        List<TestCaseDto> testCases,
        String solution,
        Boolean published
    ) {}
}
