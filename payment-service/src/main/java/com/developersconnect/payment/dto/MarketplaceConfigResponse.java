package com.developersconnect.payment.dto;

public record MarketplaceConfigResponse(
    long minPricePerMinuteCents,
    long maxPricePerMinuteCents,
    double platformSharePercent
) {}
