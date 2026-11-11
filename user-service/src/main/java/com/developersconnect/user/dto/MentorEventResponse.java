package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record MentorEventResponse(
    UUID id,
    UUID hostId,
    String hostDisplayName,
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
    boolean registeredByMe,
    boolean full,
    Set<String> tags,
    List<EventSpeakerResponse> speakers,
    List<String> openRoles,
    List<MentorEventRoleResponse> myRoles
) {
}
