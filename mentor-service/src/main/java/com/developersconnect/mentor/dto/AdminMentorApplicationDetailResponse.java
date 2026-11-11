package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminMentorApplicationDetailResponse(
    UUID id,
    String applicationCode,
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
    String adminInternalNotes,
    String infoRequestMessage,
    List<ApplicationTimelineEventDto> timeline,
    Instant createdAt,
    Instant updatedAt
) {}
