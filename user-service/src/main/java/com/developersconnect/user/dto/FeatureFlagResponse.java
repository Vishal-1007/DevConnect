package com.developersconnect.user.dto;

import java.time.Instant;

public record FeatureFlagResponse(
    String key,
    String label,
    String description,
    String category,
    boolean enabled,
    boolean critical,
    String updatedByUsername,
    Instant updatedAt
) {}
