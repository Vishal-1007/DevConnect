package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.razorpay")
public record RazorpayProperties(
    String keyId,
    String keySecret
) {
    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank()
            && keySecret != null && !keySecret.isBlank();
    }
}
