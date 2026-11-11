package com.developersconnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record UpdateMentorEventRequest(
    @Size(max = 200) String title,
    @Size(max = 2000) String description,
    @Size(max = 32) String eventType,
    @Size(max = 32) String category,
    @Size(max = 16) String format,
    @Size(max = 512) String locationOrLink,
    Instant startsAt,
    Instant endsAt,
    @Min(1) @Max(1000) Integer maxAttendees,
    String thumbnailUrl,
    Boolean paid,
    Integer priceInr,
    String topicsCovered,
    String requirements
) {
}
