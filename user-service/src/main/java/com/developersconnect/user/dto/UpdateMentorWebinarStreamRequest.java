package com.developersconnect.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateMentorWebinarStreamRequest(
    @Size(max = 512) String streamUrl,
    @Size(max = 512) String recordingUrl
) {
}
