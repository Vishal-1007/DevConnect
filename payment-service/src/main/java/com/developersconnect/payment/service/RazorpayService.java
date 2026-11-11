package com.developersconnect.payment.service;

import com.developersconnect.payment.config.RazorpayProperties;
import com.developersconnect.payment.dto.CreatePaymentIntentRequest;
import com.developersconnect.payment.dto.CreateRazorpayOrderRequest;
import com.developersconnect.payment.dto.PaymentResponse;
import com.developersconnect.payment.dto.RazorpayOrderResponse;
import com.developersconnect.payment.dto.VerifyRazorpayPaymentRequest;
import com.developersconnect.payment.saga.PaymentSagaOrchestrator;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.UUID;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RazorpayService {

    private final RazorpayProperties razorpayProperties;
    private final PaymentSagaOrchestrator paymentSagaOrchestrator;

    public RazorpayService(RazorpayProperties razorpayProperties, PaymentSagaOrchestrator paymentSagaOrchestrator) {
        this.razorpayProperties = razorpayProperties;
        this.paymentSagaOrchestrator = paymentSagaOrchestrator;
    }

    public boolean isEnabled() {
        return razorpayProperties.isConfigured();
    }

    public RazorpayOrderResponse createOrder(UUID userId, CreateRazorpayOrderRequest request) {
        assertConfigured();
        try {
            RazorpayClient client = new RazorpayClient(razorpayProperties.keyId(), razorpayProperties.keySecret());
            int amountPaise = toMinorUnits(request.amount(), request.currency());
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", request.currency().toUpperCase(Locale.ROOT));
            options.put("receipt", "dc-" + userId.toString().substring(0, 8) + "-" + System.currentTimeMillis());
            if (request.description() != null && !request.description().isBlank()) {
                options.put("notes", new JSONObject().put("description", request.description()));
            }
            Order order = client.orders.create(options);
            return new RazorpayOrderResponse(
                order.get("id"),
                request.amount(),
                request.currency().toUpperCase(Locale.ROOT),
                razorpayProperties.keyId(),
                request.description()
            );
        } catch (RazorpayException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not create Razorpay order: " + ex.getMessage());
        }
    }

    public PaymentResponse verifyAndCapture(UUID userId, VerifyRazorpayPaymentRequest request) {
        assertConfigured();
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.orderId());
            attributes.put("razorpay_payment_id", request.paymentId());
            attributes.put("razorpay_signature", request.signature());
            if (!Utils.verifyPaymentSignature(attributes, razorpayProperties.keySecret())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay signature");
            }

            RazorpayClient client = new RazorpayClient(razorpayProperties.keyId(), razorpayProperties.keySecret());
            Order order = client.orders.fetch(request.orderId());
            BigDecimal amount = fromMinorUnits(order.get("amount"), order.get("currency"));
            String currency = order.get("currency");
            String description = request.description() != null && !request.description().isBlank()
                ? request.description()
                : "DevConnect Razorpay payment";

            CreatePaymentIntentRequest paymentRequest = new CreatePaymentIntentRequest(
                amount,
                currency,
                description,
                "RAZORPAY",
                null,
                request.idempotencyKey() != null ? request.idempotencyKey() : "razorpay-" + request.paymentId()
            );
            return paymentSagaOrchestrator.checkout(userId, paymentRequest, "SUCCESS");
        } catch (RazorpayException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay verification failed: " + ex.getMessage());
        }
    }

    private void assertConfigured() {
        if (!isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay is not configured");
        }
    }

    private int toMinorUnits(BigDecimal amount, String currency) {
        if ("INR".equalsIgnoreCase(currency)) {
            return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValueExact();
        }
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    private BigDecimal fromMinorUnits(Object amountObj, Object currencyObj) {
        BigDecimal minor = new BigDecimal(amountObj.toString());
        return minor.movePointLeft(2);
    }
}
