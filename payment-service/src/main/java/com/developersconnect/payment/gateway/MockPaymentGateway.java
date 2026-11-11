package com.developersconnect.payment.gateway;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Local/dev payment gateway — simulates authorize/capture/void without external PSP credentials.
 * Swap {@code app.payment.gateway-provider} to {@code stripe} for production integration.
 */
@Component
@ConditionalOnProperty(name = "app.payment.gateway-provider", havingValue = "mock", matchIfMissing = true)
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public AuthorizationResult authorize(
        UUID paymentId,
        UUID userId,
        BigDecimal amount,
        String currency,
        String description,
        String paymentMode
    ) {
        String mode = paymentMode != null ? paymentMode.toLowerCase() : "card";
        String reference = "mock_" + mode + "_" + paymentId.toString().replace("-", "").substring(0, 12);
        return new AuthorizationResult(reference);
    }

    @Override
    public CaptureResult capture(String providerReference, BigDecimal amount, String currency) {
        return new CaptureResult(true, "Captured " + amount + " " + currency);
    }

    @Override
    public void voidAuthorization(String providerReference) {
        // no-op for mock provider
    }
}
