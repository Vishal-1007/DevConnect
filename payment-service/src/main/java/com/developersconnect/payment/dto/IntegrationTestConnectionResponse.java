package com.developersconnect.payment.dto;

public record IntegrationTestConnectionResponse(
    boolean success,
    String message,
    String connectedEmail
) {}
