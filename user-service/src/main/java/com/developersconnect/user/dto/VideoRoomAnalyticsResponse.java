package com.developersconnect.user.dto;

public record VideoRoomAnalyticsResponse(
    long totalRoomsCreated,
    long activeRooms,
    long premiumUsers,
    long completedPayments,
    long revenueCents,
    long expiredRooms
) {
}
