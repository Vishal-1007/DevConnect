package com.developersconnect.payment.dto;

import java.time.Instant;

public record RecruiterIntegrationResponse(
    String provider,
    boolean connected,
    String connectedEmail,
    Instant connectedAt,
    Instant lastSyncAt
) {}
