package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record MentorWebinarResponse(
    UUID id,
    UUID hostId,
    String hostDisplayName,
    String title,
    String description,
    String category,
    String monetization,
    String streamUrl,
    String recordingUrl,
    String streamStatus,
    Instant startsAt,
    Instant endsAt,
    int maxAttendees,
    long registeredCount,
    long attendedCount,
    boolean full,
    boolean cancelled,
    boolean enableChat,
    boolean enableScreenShare,
    boolean enableQa,
    List<EventSpeakerResponse> speakers,
    Set<String> tags,
    Instant createdAt,
    Instant updatedAt
) {
}
