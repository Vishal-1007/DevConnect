package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotNull;

public record SetParticipantCameraRequest(@NotNull Boolean enabled) {
}
