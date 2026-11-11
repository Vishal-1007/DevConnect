package com.developersconnect.mentor.dto;

public record LearningResourceAnalyticsResponse(
    long totalResources,
    long totalDownloads,
    long totalViews,
    long publicCount,
    long premiumCount,
    long draftCount
) {}
