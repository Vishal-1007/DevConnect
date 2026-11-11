package com.developersconnect.user.dto;

import java.util.List;
import java.util.UUID;

public record CommunityPostPollResponse(
    UUID id,
    String question,
    long totalVotes,
    UUID votedOptionId,
    List<CommunityPostPollOptionResponse> options
) {
}
