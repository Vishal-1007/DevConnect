package com.developersconnect.user.dto;

import java.time.Instant;

public record MentorEventRoleResponse(
    String role,
    String status,
    Instant appliedAt
) {
}
