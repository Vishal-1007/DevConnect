package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateMentorshipRequestDto(
    @NotNull UUID mentorId,
    @NotBlank String goal,
    String message
) {}
