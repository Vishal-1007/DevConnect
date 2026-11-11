package com.developersconnect.user.dto;

public record ContentModerationAnalyticsResponse(
    long totalPosts,
    long activePosts,
    long flaggedPosts,
    long autoFlaggedPosts,
    long removedPosts,
    long abusiveLanguage,
    long hateSpeech,
    long spam,
    long scam,
    long nsfw
) {}
