package com.developersconnect.user.dto;

import java.util.UUID;

public record CommunityPostUploadResponse(
    UUID fileId,
    String url,
    String name,
    long size,
    String type,
    String kind
) {
}
