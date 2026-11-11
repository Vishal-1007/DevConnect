package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record VideoRoomUsageResponse(
    boolean videoRoomPremium,
    int freeMaxParticipants,
    int freeDurationMinutes,
    int premiumPriceInr,
    boolean canCreateFreeRoom,
    Instant nextFreeRoomAvailableAt,
    UUID activeFreeRoomId,
    Long activeFreeRoomRemainingSeconds
) {
}
