package com.developersconnect.user.dto;

import java.util.UUID;

public record UpdateAdminCommunityRoomRequest(
    Boolean featured,
    Integer featuredOrder,
    String visibility,
    String category,
    UUID moderatorId
) {
}
