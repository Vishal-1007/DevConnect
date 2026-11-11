package com.developersconnect.payment.gateway;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentGateway {

    AuthorizationResult authorize(
        UUID paymentId,
        UUID userId,
        BigDecimal amount,
        String currency,
        String description,
        String paymentMode
    );

    CaptureResult capture(String providerReference, BigDecimal amount, String currency);

    void voidAuthorization(String providerReference);

    record AuthorizationResult(String providerReference, String clientSecret) {
        public AuthorizationResult(String providerReference) {
            this(providerReference, null);
        }
    }

    record CaptureResult(boolean success, String message) {
    }
}
