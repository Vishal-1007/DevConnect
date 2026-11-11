package com.developersconnect.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.chat-service")
public record ChatServiceProperties(String baseUrl) {
    public ChatServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8083";
        }
    }
}
