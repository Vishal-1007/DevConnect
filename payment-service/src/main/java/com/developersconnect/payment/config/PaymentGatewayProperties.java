package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.payment")
public record PaymentGatewayProperties(
    String gatewayProvider,
    long outboxPollMs
) {
}
