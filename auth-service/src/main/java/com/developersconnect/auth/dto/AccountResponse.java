package com.developersconnect.auth.dto;

import java.util.UUID;

public record AccountResponse(
    UUID id,
    String username,
    String email,
    String roles
) {
}
