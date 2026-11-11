package com.developersconnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record CreateVideoRoomRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 1000) String description,
    @Size(max = 32) String category,
    @Size(max = 32) String roomType,
    @Size(max = 32) String useCase,
    @Min(2) @Max(100) Integer maxParticipants,
    @Size(max = 8) Set<@NotBlank @Size(max = 64) String> tags,
    Boolean chatEnabled,
    Boolean screenShareEnabled,
    Boolean breakoutEnabled
) {
}
