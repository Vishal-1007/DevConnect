package com.developersconnect.mentor.security;

import java.util.UUID;

public record AuthPrincipal(
    UUID accountId,
    String username,
    String roles
) {
}
