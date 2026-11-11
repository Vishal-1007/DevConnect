package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorshipBookingResponse(
    UUID id,
    String bookingCode,
    UUID mentorId,
    UUID learnerId,
    String mentorDisplayName,
    String learnerDisplayName,
    Instant scheduledAt,
    String scheduledDateLabel,
    String scheduledTimeLabel,
    String timezone,
    int durationMinutes,
    String durationLabel,
    int hourlyRateCents,
    String rateLabel,
    int amountCents,
    String amountLabel,
    String status,
    String refundStatus,
    String notes,
    String requestType,
    String requestTypeLabel,
    String requestMessage,
    boolean upcoming,
    Instant createdAt,
    Instant cancelledAt,
    Instant completedAt
) {}
