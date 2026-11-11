package com.developersconnect.payment.service;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.payment.config.PaymentGatewayProperties;
import com.developersconnect.payment.config.RazorpayProperties;
import com.developersconnect.payment.config.StripeProperties;
import com.developersconnect.payment.dto.CheckoutPaymentRequest;
import com.developersconnect.payment.dto.ConfirmPaymentRequest;
import com.developersconnect.payment.dto.CreatePaymentIntentRequest;
import com.developersconnect.payment.dto.PaymentConfigResponse;
import com.developersconnect.payment.dto.PaymentModeOptionResponse;
import com.developersconnect.payment.dto.PaymentResponse;
import com.developersconnect.payment.model.Payment;
import com.developersconnect.payment.model.PaymentMode;
import com.developersconnect.payment.repository.PaymentRepository;
import com.developersconnect.payment.repository.SagaInstanceRepository;
import com.developersconnect.payment.saga.PaymentSagaOrchestrator;

@Service
public class PaymentService {

    private final PaymentSagaOrchestrator paymentSagaOrchestrator;
    private final PaymentRepository paymentRepository;
    private final SagaInstanceRepository sagaInstanceRepository;
    private final PaymentGatewayProperties gatewayProperties;
    private final StripeProperties stripeProperties;
    private final RazorpayProperties razorpayProperties;

    public PaymentService(
        PaymentSagaOrchestrator paymentSagaOrchestrator,
        PaymentRepository paymentRepository,
        SagaInstanceRepository sagaInstanceRepository,
        PaymentGatewayProperties gatewayProperties,
        StripeProperties stripeProperties,
        RazorpayProperties razorpayProperties
    ) {
        this.paymentSagaOrchestrator = paymentSagaOrchestrator;
        this.paymentRepository = paymentRepository;
        this.sagaInstanceRepository = sagaInstanceRepository;
        this.gatewayProperties = gatewayProperties;
        this.stripeProperties = stripeProperties;
        this.razorpayProperties = razorpayProperties;
    }

    @Transactional(readOnly = true)
    public List<PaymentModeOptionResponse> listPaymentModes() {
        boolean stripe = "stripe".equalsIgnoreCase(gatewayProperties.gatewayProvider());
        return Arrays.stream(PaymentMode.values())
            .map(mode -> new PaymentModeOptionResponse(
                mode.name(),
                mode.displayName(),
                modeDescription(mode),
                mode.category(),
                mode.requiresCardCollection(),
                !stripe || mode == PaymentMode.CARD
            ))
            .collect(Collectors.toList());
    }

    private String modeDescription(PaymentMode mode) {
        return switch (mode) {
            case CARD -> "Visa, Mastercard, Amex via secure card checkout";
            case UPI -> "Pay using any UPI app or VPA";
            case GPAY -> "Pay with Google Pay UPI";
            case BHIM -> "Pay with BHIM UPI";
            case PAYTM -> "Pay with Paytm wallet or UPI";
            case PHONEPE -> "Pay with PhonePe UPI";
        };
    }

    @Transactional(readOnly = true)
    public PaymentConfigResponse getConfig() {
        String publishableKey = "stripe".equalsIgnoreCase(gatewayProperties.gatewayProvider())
            ? stripeProperties.publishableKey()
            : null;
        return new PaymentConfigResponse(
            gatewayProperties.gatewayProvider(),
            publishableKey,
            razorpayProperties.keyId(),
            razorpayProperties.isConfigured()
        );
    }

    @Transactional
    public PaymentResponse createIntent(UUID userId, CreatePaymentIntentRequest request) {
        return paymentSagaOrchestrator.createPaymentIntent(userId, request);
    }

    @Transactional
    public PaymentResponse confirm(UUID userId, UUID paymentId, ConfirmPaymentRequest request) {
        String simulatedOutcome = request != null ? request.simulatedOutcome() : null;
        return paymentSagaOrchestrator.confirmPayment(userId, paymentId, simulatedOutcome);
    }

    /** Authorize + capture in one saga; capture failure voids authorization (no debit). */
    @Transactional
    public PaymentResponse checkout(UUID userId, CheckoutPaymentRequest request) {
        return paymentSagaOrchestrator.checkout(
            userId,
            request.payment(),
            request.simulatedOutcome()
        );
    }

    @Transactional(readOnly = true)
    public PaymentResponse findById(UUID userId, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        var saga = sagaInstanceRepository.findByPaymentId(payment.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Saga not found"));

        return paymentSagaOrchestrator.toResponse(payment, saga, null);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(UUID userId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit))
            .stream()
            .map(payment -> findById(userId, payment.getId()))
            .collect(Collectors.toList());
    }
}
