package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyMentorReviewRequest(
    @NotBlank @Size(max = 2000) String reply
) {}
