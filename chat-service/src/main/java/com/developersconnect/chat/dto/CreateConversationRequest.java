package com.developersconnect.chat.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record CreateConversationRequest(
    @NotEmpty List<UUID> participantIds
) {
}
