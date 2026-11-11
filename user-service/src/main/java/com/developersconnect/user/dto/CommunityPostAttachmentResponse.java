package com.developersconnect.user.dto;

import java.util.UUID;

public record CommunityPostAttachmentResponse(
    String name,
    String url,
    long size,
    String type,
    UUID fileId
) {
}
