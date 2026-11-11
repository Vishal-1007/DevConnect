package com.developersconnect.notification.dto;

public record DeliveryAnalyticsResponse(
    long totalSent,
    long deliveredCount,
    long readCount,
    long unreadCount
) {}
