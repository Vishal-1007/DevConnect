package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.internal")
public record InternalApiProperties(
    String apiKey
) {
    public InternalApiProperties {
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = "devconnect-internal";
        }
    }
}
