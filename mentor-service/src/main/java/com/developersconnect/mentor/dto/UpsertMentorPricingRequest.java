package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpsertMentorPricingRequest(
    @NotNull @Min(100) Long audioPricePerMinuteCents,
    @NotNull @Min(100) Long videoPricePerMinuteCents,
    Boolean instantCallEnabled,
    String designation,
    String company,
    Integer experienceYears,
    String expertiseTags,
    String linkedinUrl
) {}
