package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaveMentorApplicationDraftRequest(
    @NotNull @Min(1) @Max(7) Integer currentStep,
    MentorApplicationDataDto data
) {}
