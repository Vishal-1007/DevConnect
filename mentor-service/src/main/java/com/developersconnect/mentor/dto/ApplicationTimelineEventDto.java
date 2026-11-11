package com.developersconnect.mentor.dto;

import java.time.Instant;

public record ApplicationTimelineEventDto(
    String type,
    String label,
    Instant occurredAt,
    String actor
) {}
