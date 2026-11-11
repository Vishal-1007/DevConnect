package com.developersconnect.payment.dto;

import java.util.Map;

public record UpdateRecruiterIntegrationSyncSettingsRequest(
    Map<String, Object> settings
) {}
