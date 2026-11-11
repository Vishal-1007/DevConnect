package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record AdminWebinarResponse(
    UUID id,
    UUID hostId,
    String hostDisplayName,
    String hostRole,
    String title,
    String description,
    String webinarSubtype,
    String category,
    String format,
    String streamUrl,
    String recordingUrl,
    String hostApprovalStatus,
    String streamStatus,
    Instant startsAt,
    Instant endsAt,
    int maxAttendees,
    long registeredCount,
    long attendedCount,
    boolean full,
    boolean cancelled,
    List<EventSpeakerResponse> speakers,
    Set<String> tags,
    Instant createdAt,
    Instant updatedAt
) {
}
