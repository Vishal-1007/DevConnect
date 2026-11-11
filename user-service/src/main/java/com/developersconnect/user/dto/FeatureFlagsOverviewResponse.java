package com.developersconnect.user.dto;

import java.util.List;
import java.util.Map;

public record FeatureFlagsOverviewResponse(
    List<FeatureFlagResponse> features,
    int enabledCount,
    int totalCount,
    Map<String, Boolean> flags
) {}
