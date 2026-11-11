package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDiscussionReplyRequest(
    @NotBlank @Size(max = 2000) String content
) {
}
