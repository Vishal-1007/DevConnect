package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Size;

public record ReviewApplicationRequest(
    @Size(max = 512) String reviewNote
) {}
