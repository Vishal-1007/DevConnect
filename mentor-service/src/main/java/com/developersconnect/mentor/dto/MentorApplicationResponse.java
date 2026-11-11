package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorApplicationResponse(
    UUID id,
    UUID userId,
    String username,
    String headline,
    String bio,
    Integer hourlyRateCents,
    String motivation,
    String status,
    String reviewedBy,
    String reviewNote,
    Integer currentStep,
    MentorApplicationDataDto applicationData,
    Instant createdAt,
    Instant updatedAt
) {}
