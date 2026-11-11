package com.developersconnect.mentor.dto;

public record StreamAnalyticsResponse(
    long totalCourses,
    long publishedCourses,
    long totalEnrollments,
    long totalRevenueCents,
    long totalWatchTimeSeconds,
    long totalViews
) {}
