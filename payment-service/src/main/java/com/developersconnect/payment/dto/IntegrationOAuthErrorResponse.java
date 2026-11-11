package com.developersconnect.payment.dto;

public record IntegrationOAuthErrorResponse(
    boolean success,
    String message,
    String details
) {
    public static IntegrationOAuthErrorResponse of(String message, String details) {
        return new IntegrationOAuthErrorResponse(false, message, details);
    }
}
