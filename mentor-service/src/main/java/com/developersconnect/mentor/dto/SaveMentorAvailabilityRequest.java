package com.developersconnect.mentor.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveMentorAvailabilityRequest(
    boolean vacationMode,
    boolean autoSchedulingEnabled,
    @Size(max = 64) String timezone,
    List<AvailabilitySlotInput> slots
) {
    public record AvailabilitySlotInput(
        @Min(0) @Max(6) int dayOfWeek,
        @NotBlank String startTime,
        @NotBlank String endTime
    ) {}
}
