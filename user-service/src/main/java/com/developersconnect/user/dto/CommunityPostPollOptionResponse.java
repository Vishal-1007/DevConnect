package com.developersconnect.user.dto;

import java.util.UUID;

public record CommunityPostPollOptionResponse(
    UUID id,
    String text,
    long voteCount,
    int percentage
) {
}
