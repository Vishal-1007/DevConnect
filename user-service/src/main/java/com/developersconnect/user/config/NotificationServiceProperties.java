package com.developersconnect.user.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.notification-service")
public record NotificationServiceProperties(String baseUrl, String internalApiKey) {
    public NotificationServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8084";
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            internalApiKey = "devconnect-internal";
        }
    }
}
