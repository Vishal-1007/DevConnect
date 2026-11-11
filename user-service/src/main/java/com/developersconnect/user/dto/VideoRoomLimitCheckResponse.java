package com.developersconnect.user.dto;

import java.time.Instant;

public record VideoRoomLimitCheckResponse(
    boolean allowed,
    boolean premium,
    String message,
    Instant nextAvailableAt
) {}
