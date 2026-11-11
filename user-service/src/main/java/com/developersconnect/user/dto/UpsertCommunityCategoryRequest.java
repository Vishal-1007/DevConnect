package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertCommunityCategoryRequest(
    @NotBlank @Size(max = 64) String slug,
    @NotBlank @Size(max = 128) String label,
    @Size(max = 500) String description,
    Integer displayOrder,
    Boolean active
) {
}
