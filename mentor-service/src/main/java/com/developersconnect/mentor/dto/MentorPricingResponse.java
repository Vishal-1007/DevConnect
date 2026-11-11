package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorPricingResponse(
    UUID mentorId,
    long audioPricePerMinuteCents,
    long videoPricePerMinuteCents,
    String currency,
    boolean instantCallEnabled,
    String status,
    String designation,
    String company,
    Integer experienceYears,
    String expertiseTags,
    String linkedinUrl,
    long sessionsCompleted,
    Instant updatedAt
) {}
