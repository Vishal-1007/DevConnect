package com.developersconnect.payment.dto;

import java.util.List;

public record RecruiterUsageResponse(
    List<RecruiterUsageMetricResponse> metrics
) {}
