package com.developersconnect.payment.dto;

import jakarta.validation.constraints.Min;

public record SyncRecruiterJobCountRequest(
    @Min(0) int activeJobCount
) {}
