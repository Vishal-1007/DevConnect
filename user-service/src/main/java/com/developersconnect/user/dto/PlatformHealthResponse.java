package com.developersconnect.user.dto;

import java.util.List;

public record PlatformHealthResponse(
    String overallStatus,
    String overallLabel,
    List<PlatformHealthItemResponse> services
) {}
