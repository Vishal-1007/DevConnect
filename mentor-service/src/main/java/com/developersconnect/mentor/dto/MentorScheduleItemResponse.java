package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorScheduleItemResponse(
    UUID bookingId,
    String timeLabel,
    String title,
    String studentName,
    String status
) {}
