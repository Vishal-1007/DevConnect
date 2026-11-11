package com.developersconnect.payment.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.payment.gateway-provider", havingValue = "stripe")
public class StripeClientConfig {

    private final StripeProperties stripeProperties;

    public StripeClientConfig(StripeProperties stripeProperties) {
        this.stripeProperties = stripeProperties;
    }

    @PostConstruct
    void initStripe() {
        Stripe.apiKey = stripeProperties.secretKey();
    }
}
