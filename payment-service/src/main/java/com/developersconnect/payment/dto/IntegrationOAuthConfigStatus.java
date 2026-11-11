package com.developersconnect.payment.dto;

public record IntegrationOAuthConfigStatus(
    boolean configured,
    String message,
    String redirectUri
) {}
