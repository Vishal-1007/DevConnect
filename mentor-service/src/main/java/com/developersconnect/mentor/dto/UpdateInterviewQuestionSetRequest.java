package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UpdateInterviewQuestionSetRequest(
    @Size(max = 200) String title,
    @Size(max = 5000) String description,
    @Size(max = 5000) String instructions,
    @Min(5) Integer durationMinutes,
    String difficulty,
    @Size(max = 500) String thumbnailUrl,
    @Size(max = 500) String tags,
    String visibility,
    @Min(0) Integer priceCents,
    @Size(max = 8) String currency,
    Integer validityDays,
    List<UUID> questionIds,
    List<UUID> assignToLearnerIds,
    Instant dueAt,
    Boolean publish
) {}
