package com.developersconnect.user.dto;

import java.util.UUID;

public record PopularHostResponse(
    UUID userId,
    String displayName,
    String role,
    String company,
    double rating,
    long eventsHosted,
    long totalRegistrations,
    boolean following
) {
}
