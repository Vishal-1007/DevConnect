package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorWebinarAnalyticsResponse(
    UUID webinarId,
    String title,
    long registeredCount,
    long attendedCount,
    long noShowCount,
    double attendanceRate,
    int maxAttendees,
    double capacityUsedPercent,
    String streamStatus,
    String monetization,
    Instant startsAt,
    Instant endsAt
) {
}
