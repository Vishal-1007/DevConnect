package com.developersconnect.payment.security;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public final class RoleUtils {

    private RoleUtils() {}

    public static Set<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(roles.split(","))
            .map(String::trim)
            .filter(role -> !role.isEmpty())
            .map(RoleUtils::normalizeRole)
            .collect(Collectors.toSet());
    }

    public static boolean hasRole(String roles, String role) {
        return parseRoles(roles).contains(normalizeRole(role));
    }

    public static boolean hasAnyRole(String roles, String... expectedRoles) {
        Set<String> parsed = parseRoles(roles);
        return Arrays.stream(expectedRoles).anyMatch(expected -> parsed.contains(normalizeRole(expected)));
    }

    private static String normalizeRole(String role) {
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }
        return normalized;
    }
}
