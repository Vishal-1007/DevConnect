package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRejectApplicationRequest(
    @NotBlank @Size(max = 512) String reason,
    @Size(max = 512) String reviewNote
) {}
