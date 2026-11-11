package com.developersconnect.user.dto;

import java.util.UUID;

public record CommunityRoomCategoryResponse(
    UUID id,
    String slug,
    String label,
    String description,
    int displayOrder,
    boolean active,
    long roomCount
) {
}
