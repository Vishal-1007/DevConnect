package com.developersconnect.payment.dto;

import java.util.Map;

public record RecruiterIntegrationSyncSettingsResponse(
    String provider,
    Map<String, Object> settings
) {}
