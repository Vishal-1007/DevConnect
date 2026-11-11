package com.developersconnect.user.dto;

public record UpdateAdminDiscussionRequest(
    Boolean pinned,
    Integer pinnedOrder,
    Boolean removed
) {
}
