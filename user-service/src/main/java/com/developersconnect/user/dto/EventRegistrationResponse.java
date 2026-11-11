package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.UUID;

public record EventRegistrationResponse(
    UUID userId,
    String username,
    String displayName,
    Instant registeredAt,
    boolean attended,
    Instant attendedAt
) {}
