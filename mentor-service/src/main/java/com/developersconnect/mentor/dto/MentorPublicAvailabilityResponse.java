package com.developersconnect.mentor.dto;

import com.developersconnect.mentor.dto.MockInterviewDtos.AvailableSlotResponse;
import java.util.List;
import java.util.UUID;

public record MentorPublicAvailabilityResponse(
    UUID mentorId,
    String mentor,
    boolean vacationMode,
    boolean acceptingBookings,
    boolean autoSchedulingEnabled,
    String timezone,
    List<WeeklySlotResponse> weeklySlots,
    List<DailySlotsResponse> availableSlots,
    List<AvailableSlotResponse> slots
) {
    public record WeeklySlotResponse(
        int dayOfWeek,
        String day,
        String startTime,
        String endTime
    ) {}

    public record DailySlotsResponse(
        String date,
        List<String> times
    ) {}
}
