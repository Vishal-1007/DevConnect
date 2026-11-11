package com.developersconnect.mentor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.payment-service")
public record PaymentServiceProperties(
    String baseUrl,
    String internalApiKey
) {
    public PaymentServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8089";
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            internalApiKey = "devconnect-internal";
        }
    }
}
