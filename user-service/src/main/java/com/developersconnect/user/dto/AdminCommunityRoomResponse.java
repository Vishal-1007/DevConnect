package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record AdminCommunityRoomResponse(
    UUID id,
    String title,
    String description,
    String category,
    String categoryLabel,
    String status,
    String visibility,
    String visibilityLabel,
    boolean featured,
    int featuredOrder,
    UUID hostId,
    String hostDisplayName,
    UUID moderatorId,
    String moderatorDisplayName,
    int maxParticipants,
    long participantCount,
    Set<String> tags,
    Instant createdAt
) {
}
