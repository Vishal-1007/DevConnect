package com.developersconnect.user.dto;

import java.util.UUID;

public record EventSpeakerResponse(
    UUID userId,
    String displayName,
    String role
) {
}
