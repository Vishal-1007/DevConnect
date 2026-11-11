package com.developersconnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBreakoutRoomRequest(
    @NotBlank @Size(max = 200) String title,
    @Min(2) @Max(20) Integer maxParticipants
) {
}
