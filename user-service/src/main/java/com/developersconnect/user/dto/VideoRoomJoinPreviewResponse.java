package com.developersconnect.user.dto;

import java.util.UUID;

public record VideoRoomJoinPreviewResponse(
    UUID roomId,
    String roomCode,
    String title,
    String hostDisplayName,
    long participantCount,
    int maxParticipants,
    String status,
    boolean full,
    boolean premiumRoom,
    Long remainingSeconds
) {
}
