package com.developersconnect.user.dto;

public record DiscussionAnalyticsResponse(
    long totalThreads,
    long activeThreads,
    long pinnedThreads,
    long removedThreads,
    long solvedThreads
) {
}
