package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record CreateDiscussionThreadRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 4000) String content,
    @Size(max = 32) String topic,
    @Size(max = 8) Set<@NotBlank @Size(max = 64) String> tags
) {
}
