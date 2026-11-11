package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorBookingReminderResponse(
    UUID bookingId,
    String bookingCode,
    String title,
    String learnerName,
    Instant scheduledAt,
    String scheduledLabel,
    String reminderLabel,
    long minutesUntil
) {}
