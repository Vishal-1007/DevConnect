package com.developersconnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UpdateAdminCommunityEventRequest(
    UUID hostId,
    @Size(max = 200) String title,
    @Size(max = 2000) String description,
    @Size(max = 32) String eventType,
    @Size(max = 32) String category,
    @Size(max = 16) String format,
    @Size(max = 512) String locationOrLink,
    Instant startsAt,
    Instant endsAt,
    @Min(1) @Max(1000) Integer maxAttendees,
    @Size(max = 8) Set<@Size(max = 64) String> tags,
    @Size(max = 10) Set<UUID> speakerIds,
    Boolean cancelled
) {
}
