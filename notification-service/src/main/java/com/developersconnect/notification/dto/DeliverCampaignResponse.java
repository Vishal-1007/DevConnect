package com.developersconnect.notification.dto;

import java.util.UUID;

public record DeliverCampaignResponse(
    UUID platformNotificationId,
    int deliveredCount
) {}
