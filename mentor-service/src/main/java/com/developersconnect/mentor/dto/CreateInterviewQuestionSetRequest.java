package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateInterviewQuestionSetRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 5000) String description,
    @Size(max = 5000) String instructions,
    @Min(5) int durationMinutes,
    @NotBlank String difficulty,
    @Size(max = 500) String thumbnailUrl,
    @Size(max = 500) String tags,
    @NotBlank String visibility,
    @Min(0) int priceCents,
    @Size(max = 8) String currency,
    Integer validityDays,
    @NotNull List<UUID> questionIds,
    List<UUID> assignToLearnerIds,
    Instant dueAt,
    Boolean publish
) {}
