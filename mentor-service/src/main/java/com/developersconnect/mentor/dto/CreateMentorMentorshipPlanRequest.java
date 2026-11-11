package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateMentorMentorshipPlanRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 1000) String description,
    @NotBlank @Size(max = 32) String planType,
    @NotBlank @Size(max = 32) String billingType,
    @Min(0) int priceCents,
    @Min(0) int sessionLimit,
    @Min(15) @Max(480) int durationMinutes,
    @Size(max = 64) String durationLabel,
    boolean premiumSupport,
    boolean popular,
    boolean active,
    Integer sortOrder,
    List<@NotBlank @Size(max = 200) String> features
) {}
