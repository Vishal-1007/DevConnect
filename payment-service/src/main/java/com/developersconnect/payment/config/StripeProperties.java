package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.stripe")
public record StripeProperties(
    String secretKey,
    String publishableKey,
    String webhookSecret
) {
    public boolean isConfigured() {
        return secretKey != null && !secretKey.isBlank();
    }
}
