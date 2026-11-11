package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public final class MockInterviewDtos {

    private MockInterviewDtos() {}

    public record MarketplaceStatsResponse(
        long interviewerCount,
        long interviewsConducted,
        double averageRating,
        double satisfactionRate
    ) {}

    public record CategoryCountResponse(String id, String label, long mentorCount, double averageRating) {}

    public record AvailableSlotResponse(
        String startAt,
        String endAt,
        String date,
        String time,
        int durationMinutes,
        boolean available
    ) {}

    public record BookInterviewBody(
        UUID interviewerId,
        UUID paymentId,
        String interviewType,
        String scheduledAt,
        int durationMinutes,
        String message
    ) {}

    public record BookingSummaryResponse(
        int interviewPriceCents,
        int platformFeeCents,
        int totalCents,
        String currency
    ) {}

    public record InterviewerCardResponse(
        UUID id,
        UUID userId,
        String name,
        String headline,
        String company,
        String experience,
        List<String> skills,
        double rating,
        long totalReviews,
        long totalInterviews,
        int pricePerInterviewCents,
        String priceLabel,
        String profilePicture,
        boolean online,
        boolean favorited,
        String requestStatus
    ) {}

    public record InterviewerDetailResponse(
        UUID id,
        UUID userId,
        String name,
        String headline,
        String company,
        String designation,
        String experience,
        List<String> skills,
        String bio,
        double rating,
        long totalReviews,
        long totalInterviews,
        int pricePerInterviewCents,
        String priceLabel,
        String profilePicture,
        boolean online,
        boolean favorited,
        String requestStatus,
        List<ReviewSnippetResponse> recentReviews
    ) {}

    public record ReviewSnippetResponse(
        String reviewerName,
        double rating,
        String comment,
        String createdAt
    ) {}

    public record CreateRequestBody(
        UUID interviewerId,
        String interviewType,
        String difficulty,
        String focusTopic,
        String message,
        String preferredDate
    ) {}

    public record SubmitFeedbackBody(
        UUID sessionId,
        int technicalScore,
        int communicationScore,
        int problemSolvingScore,
        int systemDesignScore,
        String strengths,
        String weaknesses,
        String recommendations,
        double overallRating
    ) {}

    public record FeedbackResponse(
        UUID id,
        UUID sessionId,
        UUID learnerId,
        UUID interviewerId,
        String interviewerName,
        int technicalScore,
        int communicationScore,
        int problemSolvingScore,
        int systemDesignScore,
        String strengths,
        String weaknesses,
        String recommendations,
        double overallRating,
        String createdAt
    ) {}
}
