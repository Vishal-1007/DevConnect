package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record MarketplaceStatsResponse(
    long availableMentors,
    long onlineNow,
    long averagePricePerMinuteCents,
    long callsToday
) {}
