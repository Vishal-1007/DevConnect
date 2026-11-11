package com.developersconnect.mentor.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class InterviewMarketplaceDtos {

    private InterviewMarketplaceDtos() {}

    public record InterviewPackCardResponse(
        UUID id,
        String title,
        String description,
        String thumbnailUrl,
        String mentorName,
        UUID mentorId,
        double mentorRating,
        String difficulty,
        String difficultyLabel,
        int questionCount,
        int durationMinutes,
        String visibility,
        String status,
        int priceCents,
        String currency,
        String priceLabel,
        String validityLabel,
        double avgRating,
        int reviewCount,
        int salesCount,
        boolean purchased,
        boolean free,
        List<String> tags
    ) {}

    public record InterviewPackDetailResponse(
        UUID id,
        String title,
        String description,
        String instructions,
        String thumbnailUrl,
        String mentorName,
        UUID mentorId,
        double mentorRating,
        String difficulty,
        String difficultyLabel,
        int questionCount,
        int durationMinutes,
        String visibility,
        int priceCents,
        String currency,
        String priceLabel,
        String validityLabel,
        Integer validityDays,
        double avgRating,
        int reviewCount,
        boolean purchased,
        boolean hasAccess,
        boolean free,
        List<String> tags,
        List<InterviewPackQuestionPreview> sampleQuestions,
        List<InterviewPackQuestionPreview> questions,
        List<InterviewPackReviewResponse> reviews
    ) {}

    public record InterviewPackQuestionPreview(
        UUID id,
        String title,
        String questionText,
        String category,
        String categoryLabel,
        String difficulty,
        String difficultyLabel,
        Integer estimatedMinutes,
        boolean locked
    ) {}

    public record InterviewPackReviewResponse(
        UUID id,
        String learnerName,
        int rating,
        String reviewText,
        String createdAtLabel
    ) {}

    public record ConfirmInterviewPackPurchaseRequest(
        @NotNull UUID paymentId
    ) {}

    public record CreatePackReviewRequest(
        @Min(1) @Max(5) int rating,
        @Size(max = 2000) String reviewText
    ) {}

    public record InterviewAssignmentCardResponse(
        UUID id,
        UUID questionSetId,
        String packTitle,
        String mentorName,
        UUID mentorId,
        int questionCount,
        String dueDateLabel,
        Instant dueAt,
        String status,
        String statusLabel,
        boolean hasFeedback,
        Double overallScore,
        Instant assignedAt
    ) {}

    public record InterviewAssignmentDetailResponse(
        UUID id,
        UUID questionSetId,
        String packTitle,
        String instructions,
        int durationMinutes,
        String status,
        List<InterviewQuestionSolveResponse> questions,
        List<InterviewSubmissionResponse> submissions,
        InterviewFeedbackResponse feedback
    ) {}

    public record InterviewQuestionSolveResponse(
        UUID id,
        int index,
        String title,
        String questionText,
        String description,
        String category,
        String difficulty,
        Integer estimatedMinutes
    ) {}

    public record InterviewSubmissionResponse(
        UUID questionId,
        String answerType,
        String answerText,
        String answerCode,
        String codeLanguage,
        String fileUrl,
        String fileName
    ) {}

    public record SubmitInterviewAnswersRequest(
        @NotNull List<AnswerSubmission> answers
    ) {
        public record AnswerSubmission(
            @NotNull UUID questionId,
            @NotBlank String answerType,
            String answerText,
            String answerCode,
            String codeLanguage,
            String fileUrl,
            String fileName
        ) {}
    }

    public record InterviewFeedbackResponse(
        UUID id,
        BigDecimal overallScore,
        String strengths,
        String improvements,
        String recommendations,
        String comments,
        String reviewedAtLabel
    ) {}

    public record SubmitInterviewFeedbackRequest(
        @NotNull @Min(0) @Max(10) BigDecimal overallScore,
        @Size(max = 5000) String strengths,
        @Size(max = 5000) String improvements,
        @Size(max = 5000) String recommendations,
        @Size(max = 5000) String comments
    ) {}

    public record InterviewPurchaseResponse(
        UUID id,
        UUID questionSetId,
        String packTitle,
        String thumbnailUrl,
        String mentorName,
        int amountCents,
        String currency,
        String amountLabel,
        String status,
        String purchasedAtLabel,
        String expiresAtLabel,
        boolean expired,
        boolean hasAccess
    ) {}

    public record InterviewAnalyticsResponse(
        int questionSetsCreated,
        int publicFreePacks,
        int publicPaidPacks,
        int privateAssignments,
        int totalPurchases,
        long revenueCents,
        String revenueLabel,
        int pendingReviews,
        double averageRating,
        double completionRatePct,
        List<MonthlyMetric> monthlyRevenue,
        List<MonthlyMetric> packSales,
        List<MonthlyMetric> submissionTrends
    ) {
        public record MonthlyMetric(String month, long value) {}
    }

    public record InterviewPageResponse<T>(
        List<T> items,
        int page,
        int size,
        long total,
        boolean hasMore
    ) {}
}
