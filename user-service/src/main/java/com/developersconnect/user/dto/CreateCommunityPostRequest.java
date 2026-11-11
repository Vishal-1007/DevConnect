package com.developersconnect.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record CreateCommunityPostRequest(
    @Size(max = 2000) String content,
    @Size(max = 32) String category,
    @Size(max = 8) Set<@NotBlank @Size(max = 64) String> tags,
    String imageUrl,
    UUID imageFileId,
    String attachmentName,
    String attachmentUrl,
    Long attachmentSize,
    String attachmentType,
    UUID attachmentFileId,
    @Valid CommunityPostCodeRequest code,
    @Valid CommunityPostPollCreateRequest poll
) {
}
