package com.developersconnect.user.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mentor-service")
public record MentorServiceProperties(String baseUrl) {
    public MentorServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8086";
        }
    }
}
