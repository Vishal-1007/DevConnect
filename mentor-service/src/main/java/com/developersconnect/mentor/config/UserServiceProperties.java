package com.developersconnect.mentor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.user-service")
public record UserServiceProperties(String baseUrl, String internalApiKey) {
    public UserServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8082";
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            internalApiKey = "devconnect-internal";
        }
    }
}
