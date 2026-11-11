package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateMentorMentorshipPlanRequest(
    @Size(max = 200) String title,
    @Size(max = 1000) String description,
    @Size(max = 32) String planType,
    @Size(max = 32) String billingType,
    @Min(0) Integer priceCents,
    @Min(0) Integer sessionLimit,
    @Min(15) @Max(480) Integer durationMinutes,
    @Size(max = 64) String durationLabel,
    Boolean premiumSupport,
    Boolean popular,
    Boolean active,
    Integer sortOrder,
    List<@Size(max = 200) String> features
) {}
