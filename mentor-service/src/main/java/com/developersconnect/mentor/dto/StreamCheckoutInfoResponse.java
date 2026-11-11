package com.developersconnect.mentor.dto;

import java.util.UUID;

public record StreamCheckoutInfoResponse(
    UUID courseId,
    String courseTitle,
    int amountCents,
    String currency,
    String description
) {}
