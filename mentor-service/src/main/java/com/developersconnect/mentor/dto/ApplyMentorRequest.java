package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplyMentorRequest(
    @NotBlank @Size(max = 128) String headline,
    @Size(max = 1024) String bio,
    Integer hourlyRateCents,
    @NotBlank @Size(max = 1024) String motivation
) {}
