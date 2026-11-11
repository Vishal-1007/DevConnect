package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateLearningCategoryRequest(
    @NotBlank String name,
    int sortOrder
) {}
