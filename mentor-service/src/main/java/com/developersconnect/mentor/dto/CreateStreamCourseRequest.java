package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.Set;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStreamCourseRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 5000) String description,
    @Size(max = 64) String category,
    @Size(max = 512) String thumbnailUrl,
    @Size(max = 512) String bannerUrl,
    @NotBlank @Size(max = 16) String pricingType,
    @Size(max = 3) String currency,
    @Min(0) int priceCents,
    @Min(0) Integer discountPriceCents,
    @NotBlank @Size(max = 16) String difficulty,
    Set<@Size(max = 64) String> tags,
    @Size(max = 5000) String whatYouLearn,
    @Size(max = 2000) String requirements,
    List<CreateStreamSectionRequest> sections
) {}
