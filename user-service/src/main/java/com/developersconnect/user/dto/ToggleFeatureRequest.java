package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleFeatureRequest(
    @NotNull Boolean enabled
) {}
