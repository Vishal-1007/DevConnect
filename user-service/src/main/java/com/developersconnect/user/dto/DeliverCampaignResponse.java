package com.developersconnect.user.dto;

import java.util.UUID;

public record DeliverCampaignResponse(UUID platformNotificationId, int deliveredCount) {}
