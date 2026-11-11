package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorRecurringPlanResponse(
    UUID id,
    UUID learnerId,
    String learnerName,
    String title,
    String frequency,
    String frequencyLabel,
    int dayOfWeek,
    String dayLabel,
    String startTime,
    int durationMinutes,
    String durationLabel,
    String status,
    Instant nextSessionAt,
    String nextSessionLabel
) {}
