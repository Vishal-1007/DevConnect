package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpsertMentorProfileRequest(
    @Size(max = 128) String headline,
    @Size(max = 1024) String bio,
    @Min(0) Integer hourlyRateCents,
    Boolean available
) {
}
