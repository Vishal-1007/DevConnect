package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CommunityPostPollCreateRequest(
    @NotBlank @Size(max = 300) String question,
    @NotNull @Size(min = 2, max = 5) List<@NotBlank @Size(max = 120) String> options
) {
}
