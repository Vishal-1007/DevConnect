package com.developersconnect.user.dto;

public record DeliveryAnalyticsResponse(
    long totalSent,
    long deliveredCount,
    long readCount,
    long unreadCount
) {}
