package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminReviewNoteRequest(
    @NotBlank @Size(max = 4000) String notes
) {}
