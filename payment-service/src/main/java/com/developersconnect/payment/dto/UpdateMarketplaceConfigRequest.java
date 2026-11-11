package com.developersconnect.payment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateMarketplaceConfigRequest(
    @Min(100) Long minPricePerMinuteCents,
    @Min(100) Long maxPricePerMinuteCents,
    @Min(0) @Max(100) Double platformSharePercent
) {}
