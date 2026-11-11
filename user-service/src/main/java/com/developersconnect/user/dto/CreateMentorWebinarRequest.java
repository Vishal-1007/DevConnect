package com.developersconnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Set;

public record CreateMentorWebinarRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 2000) String description,
    @Size(max = 32) String category,
    @NotBlank @Size(max = 16) String monetization,
    @Size(max = 512) String streamUrl,
    @NotNull Instant startsAt,
    @NotNull Instant endsAt,
    @Min(1) @Max(500) Integer maxAttendees,
    @Size(max = 8) Set<@NotBlank @Size(max = 64) String> tags,
    Boolean enableChat,
    Boolean enableScreenShare,
    Boolean enableQa
) {
}
