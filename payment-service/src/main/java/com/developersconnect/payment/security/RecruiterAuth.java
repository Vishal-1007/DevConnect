package com.developersconnect.payment.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

public final class RecruiterAuth {

    private RecruiterAuth() {}

    public static AuthPrincipal requireAuthenticated(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return principal;
    }

    public static AuthPrincipal requireRecruiterRole(Authentication authentication) {
        AuthPrincipal principal = requireAuthenticated(authentication);
        if (!RoleUtils.hasAnyRole(principal.roles(), "RECRUITER", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Recruiter access required");
        }
        return principal;
    }
}
