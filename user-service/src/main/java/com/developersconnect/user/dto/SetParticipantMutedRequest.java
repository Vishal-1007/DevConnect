package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotNull;

public record SetParticipantMutedRequest(
    @NotNull Boolean muted
) {
}
