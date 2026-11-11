package com.developersconnect.payment.dto;

public record InternalVerifyPurchaseResponse(
    boolean valid,
    String status
) {}
