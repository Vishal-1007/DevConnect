package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStreamSectionBody(
    @NotBlank @Size(max = 200) String title,
    @Min(0) int sortOrder
) {
}
