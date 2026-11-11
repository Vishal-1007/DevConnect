package com.developersconnect.auth.security;

import java.util.UUID;

public record AuthPrincipal(
    UUID accountId,
    String username,
    String roles
) {
}
