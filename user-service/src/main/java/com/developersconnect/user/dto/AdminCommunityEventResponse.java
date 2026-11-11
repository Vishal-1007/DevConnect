package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record AdminCommunityEventResponse(
    UUID id,
    UUID hostId,
    String hostDisplayName,
    String hostRole,
    String title,
    String description,
    String eventType,
    String category,
    String format,
    String locationOrLink,
    Instant startsAt,
    Instant endsAt,
    int maxAttendees,
    long attendeeCount,
    boolean full,
    boolean cancelled,
    List<EventSpeakerResponse> speakers,
    Set<String> tags,
    Instant createdAt,
    Instant updatedAt,
    String thumbnailUrl,
    boolean paid,
    int priceInr,
    boolean featured,
    String approvalStatus,
    long revenueInr,
    long mentorShareInr
) {
}
