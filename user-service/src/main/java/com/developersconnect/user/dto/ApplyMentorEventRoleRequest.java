package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplyMentorEventRoleRequest(
    @NotBlank @Size(max = 32) String role
) {
}
