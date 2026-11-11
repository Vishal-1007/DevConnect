package com.developersconnect.user.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.chat-service")
public record ChatServiceProperties(
    String baseUrl,
    String internalApiKey
) {
}
