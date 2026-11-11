package com.developersconnect.mentor.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CodeReviewDtos {

    private CodeReviewDtos() {}

    public record AiReviewUsageResponse(
        int freeLimit,
        int used,
        int remaining,
        int paidReviews,
        String reviewDate
    ) {}

    public record AnalyzeCodeReviewRequest(
        String title,
        String languageId,
        String languageLabel,
        String framework,
        String githubUrl,
        String code,
        List<String> focusAreas
    ) {}

    public record CodeReviewIssueDto(
        String id,
        String severity,
        String category,
        String problem,
        String explanation,
        String solution,
        String codeSuggestion
    ) {}

    public record CategoryScoresDto(
        double security,
        double performance,
        double architecture,
        double cleanCode,
        double interviewStandard
    ) {}

    public record CodeReviewReportResponse(
        double overallScore,
        CategoryScoresDto scores,
        List<CodeReviewIssueDto> critical,
        List<CodeReviewIssueDto> improvements,
        List<CodeReviewIssueDto> goodPractices,
        String summary,
        AnalyzeCodeReviewRequest submission,
        String source
    ) {}

    public record CodeReviewOrderResponse(
        BigDecimal amount,
        String currency,
        String description,
        String idempotencyKey,
        int priceCents
    ) {}

    public record ConfirmCodeReviewPaymentRequest(UUID paymentId) {}

    public record PaymentRequiredResponse(
        String code,
        String message,
        AiReviewUsageResponse usage
    ) {}

    public record PlanLimits(
        int freeDailyLimit,
        BigDecimal paidReviewPriceInr
    ) {}

    public static CategoryScoresDto emptyScores() {
        return new CategoryScoresDto(0, 0, 0, 0, 0);
    }

    public static CategoryScoresDto fromMap(Map<String, Double> map) {
        return new CategoryScoresDto(
            map.getOrDefault("security", 0.0),
            map.getOrDefault("performance", 0.0),
            map.getOrDefault("architecture", 0.0),
            map.getOrDefault("clean-code", map.getOrDefault("cleanCode", 0.0)),
            map.getOrDefault("interview-standard", map.getOrDefault("interviewStandard", 0.0))
        );
    }
}
