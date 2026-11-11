package com.developersconnect.mentor.dto;

public record LearningVideoAnalyticsResponse(
    long totalVideos,
    long totalViews,
    long totalWatchSeconds,
    long publicCount,
    long premiumCount,
    long draftCount
) {}
