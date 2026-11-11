package com.developersconnect.user.dto;

import java.util.Map;

public record CommunityRoomAnalyticsResponse(
    long totalRooms,
    long liveRooms,
    long featuredCount,
    long publicCount,
    long unlistedCount,
    long privateCount,
    long withModeratorCount,
    Map<String, Long> roomsByCategory
) {
}
