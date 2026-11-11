package com.developersconnect.mentor.security;

import java.util.Arrays;

public final class RoleUtils {

    private RoleUtils() {}

    public static boolean hasRole(AuthPrincipal principal, String role) {
        if (principal == null || principal.roles() == null || role == null) {
            return false;
        }
        String target = role.trim().toUpperCase();
        return Arrays.stream(principal.roles().split(","))
            .map(String::trim)
            .map(r -> r.startsWith("ROLE_") ? r.substring(5) : r)
            .map(String::toUpperCase)
            .anyMatch(r -> r.equals(target));
    }
}
