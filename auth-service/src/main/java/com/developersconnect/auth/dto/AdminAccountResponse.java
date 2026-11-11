package com.developersconnect.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminAccountResponse(
    UUID id,
    String username,
    String email,
    String roles,
    boolean enabled,
    Instant createdAt
) {}
