package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorApplicationDraftResponse(
    UUID id,
    UUID userId,
    int currentStep,
    MentorApplicationDataDto data,
    String status,
    Instant updatedAt
) {}
