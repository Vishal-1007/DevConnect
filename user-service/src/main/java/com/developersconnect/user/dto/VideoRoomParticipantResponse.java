package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

/** Video room participant snapshot for lobby and in-session UI. */
public record VideoRoomParticipantResponse(
    UUID userId,
    String displayName,
    String role,
    boolean host,
    String participantRole,
    String joinStatus,
    boolean muted,
    boolean cameraEnabled,
    boolean canSpeak,
    boolean handRaised,
    Instant joinedAt
) {
}
