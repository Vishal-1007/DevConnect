package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Set;

public record CreateMentorEventRequest(
    @NotBlank String title,
    @NotBlank String description,
    String eventType,
    String category,
    String format,
    String locationOrLink,
    @NotNull Instant startsAt,
    @NotNull Instant endsAt,
    Integer maxAttendees,
    Set<String> tags,
    String thumbnailUrl,
    boolean paid,
    Integer priceInr,
    String topicsCovered,
    String requirements
) {
}
