package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommunityPostCodeRequest(
    @NotBlank @Size(max = 32) String language,
    @NotBlank String content
) {
}
