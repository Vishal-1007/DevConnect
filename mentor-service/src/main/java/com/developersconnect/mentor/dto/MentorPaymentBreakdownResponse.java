package com.developersconnect.mentor.dto;

public record MentorPaymentBreakdownResponse(
    String category,
    long amountCents,
    String amountLabel,
    long sessionCount,
    double sharePct
) {}
