package com.developersconnect.payment.gateway;

import com.developersconnect.payment.config.StripeProperties;
import com.developersconnect.payment.model.PaymentMode;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCancelParams;
import com.stripe.param.PaymentIntentCaptureParams;
import com.stripe.param.PaymentIntentCreateParams;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.payment.gateway-provider", havingValue = "stripe")
public class StripePaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(StripePaymentGateway.class);

    private final StripeProperties stripeProperties;

    public StripePaymentGateway(StripeProperties stripeProperties) {
        this.stripeProperties = stripeProperties;
        if (!stripeProperties.isConfigured()) {
            throw new IllegalStateException(
                "Stripe gateway selected but app.stripe.secret-key is not configured"
            );
        }
    }

    @Override
    public AuthorizationResult authorize(
        UUID paymentId,
        UUID userId,
        BigDecimal amount,
        String currency,
        String description,
        String paymentMode
    ) {
        PaymentMode mode = PaymentMode.resolve(paymentMode, null);
        if (mode != PaymentMode.CARD) {
            throw new IllegalStateException(
                "Stripe gateway only supports CARD payments. Selected mode: " + mode.name()
            );
        }

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(toMinorUnits(amount))
                .setCurrency(currency.toLowerCase())
                .setDescription(description)
                .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.MANUAL)
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                        .setEnabled(true)
                        .build()
                )
                .putMetadata("paymentId", paymentId.toString())
                .putMetadata("userId", userId.toString())
                .putMetadata("paymentMode", mode.name())
                .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return new AuthorizationResult(intent.getId(), intent.getClientSecret());
        } catch (StripeException ex) {
            log.error("Stripe authorization failed for payment {}", paymentId, ex);
            throw new IllegalStateException("Stripe authorization failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public CaptureResult capture(String providerReference, BigDecimal amount, String currency) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(providerReference);
            String status = intent.getStatus();

            if ("succeeded".equals(status)) {
                return new CaptureResult(true, "Payment already captured");
            }

            if ("requires_capture".equals(status)) {
                intent = intent.capture(PaymentIntentCaptureParams.builder().build());
                return new CaptureResult(true, "Captured " + amount + " " + currency);
            }

            return new CaptureResult(false, "Unexpected Stripe status: " + status);
        } catch (StripeException ex) {
            log.error("Stripe capture failed for {}", providerReference, ex);
            return new CaptureResult(false, ex.getMessage());
        }
    }

    @Override
    public void voidAuthorization(String providerReference) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(providerReference);
            String status = intent.getStatus();
            if ("canceled".equals(status) || "succeeded".equals(status)) {
                return;
            }
            intent.cancel(PaymentIntentCancelParams.builder().build());
        } catch (StripeException ex) {
            log.warn("Stripe void/cancel failed for {}: {}", providerReference, ex.getMessage());
        }
    }

    public String publishableKey() {
        return stripeProperties.publishableKey();
    }

    private long toMinorUnits(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }
}
