package com.developersconnect.mentor.dto;

import java.util.List;

import com.developersconnect.mentor.dto.MentorAvailabilityResponse.AvailabilitySlotResponse;

public record MentorMyAvailabilityResponse(
    boolean vacationMode,
    boolean acceptingBookings,
    boolean autoSchedulingEnabled,
    String timezone,
    String workingHoursSummary,
    List<AvailabilitySlotResponse> slots
) {}
