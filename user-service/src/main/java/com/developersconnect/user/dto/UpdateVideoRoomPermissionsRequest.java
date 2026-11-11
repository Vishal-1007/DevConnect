package com.developersconnect.user.dto;

public record UpdateVideoRoomPermissionsRequest(
    Boolean chatEnabled,
    Boolean screenShareEnabled,
    Boolean breakoutEnabled
) {
}
