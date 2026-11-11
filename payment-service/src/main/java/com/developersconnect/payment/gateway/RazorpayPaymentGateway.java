package com.developersconnect.payment.gateway;

import com.developersconnect.payment.config.RazorpayProperties;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.UUID;
import org.json.JSONObject;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.payment.gateway-provider", havingValue = "razorpay")
public class RazorpayPaymentGateway implements PaymentGateway {

    private final RazorpayProperties razorpayProperties;

    public RazorpayPaymentGateway(RazorpayProperties razorpayProperties) {
        this.razorpayProperties = razorpayProperties;
        if (!razorpayProperties.isConfigured()) {
            throw new IllegalStateException("Razorpay gateway selected but app.razorpay keys are not configured");
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
        try {
            RazorpayClient client = new RazorpayClient(razorpayProperties.keyId(), razorpayProperties.keySecret());
            JSONObject options = new JSONObject();
            options.put("amount", toMinorUnits(amount, currency));
            options.put("currency", currency.toUpperCase(Locale.ROOT));
            options.put("receipt", paymentId.toString());
            if (description != null && !description.isBlank()) {
                options.put("notes", new JSONObject().put("description", description));
            }
            Order order = client.orders.create(options);
            return new AuthorizationResult(order.get("id"));
        } catch (RazorpayException ex) {
            throw new IllegalStateException("Razorpay authorize failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public CaptureResult capture(String providerReference, BigDecimal amount, String currency) {
        return new CaptureResult(true, "Razorpay order " + providerReference + " captured");
    }

    @Override
    public void voidAuthorization(String providerReference) {
        // Razorpay orders auto-expire; no explicit void required for unpaid orders.
    }

    private int toMinorUnits(BigDecimal amount, String currency) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValueExact();
    }
}
