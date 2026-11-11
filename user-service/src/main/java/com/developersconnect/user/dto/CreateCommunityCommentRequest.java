package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateCommunityCommentRequest(
    @NotBlank @Size(max = 512) String content,
    UUID parentCommentId
) {
}
