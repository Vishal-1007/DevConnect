package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorStudentSessionHistoryItem(
    UUID bookingId,
    String bookingCode,
    String title,
    String requestType,
    String status,
    String dateLabel,
    int durationMinutes,
    Instant scheduledAt
) {}
