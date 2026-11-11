package com.developersconnect.mentor.security;

import java.util.UUID;
import org.springframework.security.core.Authentication;

public final class AuthSupport {

    private AuthSupport() {
    }

    public static AuthPrincipal requirePrincipal(Authentication auth) {
        return (AuthPrincipal) auth.getPrincipal();
    }

    public static UUID requireUserId(Authentication auth) {
        return ((AuthPrincipal) auth.getPrincipal()).accountId();
    }

    public static UUID optionalUserId(Authentication auth) {
        if (auth == null) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (!(principal instanceof AuthPrincipal)) {
            return null;
        }
        return ((AuthPrincipal) principal).accountId();
    }
}
