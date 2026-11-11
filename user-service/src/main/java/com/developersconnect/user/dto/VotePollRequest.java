package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record VotePollRequest(
    @NotNull UUID optionId
) {
}
