package com.developersconnect.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateWebinarStreamRequest(
    @Size(max = 512) String streamUrl,
    @Size(max = 512) String recordingUrl
) {
}
