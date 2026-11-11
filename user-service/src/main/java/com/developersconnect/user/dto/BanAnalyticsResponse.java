package com.developersconnect.user.dto;

public record BanAnalyticsResponse(
    long activeBans,
    long permanentBans,
    long temporaryBans,
    long repeatedOffenders,
    long totalBanHistory
) {}
