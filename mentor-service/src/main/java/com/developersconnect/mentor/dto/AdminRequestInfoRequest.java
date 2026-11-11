package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRequestInfoRequest(
    @NotBlank @Size(max = 1024) String message
) {}
