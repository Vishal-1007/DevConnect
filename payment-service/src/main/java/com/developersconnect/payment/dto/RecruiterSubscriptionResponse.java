package com.developersconnect.payment.dto;

import java.time.Instant;
import java.util.Map;

public record RecruiterSubscriptionResponse(
    String planType,
    String planName,
    String status,
    Instant startDate,
    Instant expiryDate,
    String renewalLabel,
    RecruiterUsageResponse usage,
    Map<String, Boolean> features
) {}
