package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTutorialRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    String category,
    @NotBlank String difficulty,
    String tags,
    @NotBlank String courseType,
    Integer priceCents
) {}
