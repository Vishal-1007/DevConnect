package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record MentorAvailabilityResponse(
    UUID mentorId,
    String mentorDisplayName,
    boolean mentorAvailable,
    int activeSlotCount,
    List<AvailabilitySlotResponse> slots
) {
    public record AvailabilitySlotResponse(
        UUID id,
        int dayOfWeek,
        String dayLabel,
        String startTime,
        String endTime,
        String timezone,
        boolean active
    ) {}
}
