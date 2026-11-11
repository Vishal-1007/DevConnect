package com.developersconnect.user.dto;

public record NotificationAnalyticsResponse(
    int totalCampaigns,
    int sentCount,
    int scheduledCount,
    int draftCount,
    int totalRecipients,
    int userCount,
    long deliveredCount,
    long readCount,
    long unreadCount
) {}