package com.developersconnect.payment.service;

import com.developersconnect.payment.config.StripeProperties;
import com.developersconnect.payment.model.ProcessedStripeEvent;
import com.developersconnect.payment.repository.ProcessedStripeEventRepository;
import com.developersconnect.payment.saga.PaymentSagaOrchestrator;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@ConditionalOnProperty(name = "app.payment.gateway-provider", havingValue = "stripe")
public class StripeWebhookService {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookService.class);

    private final StripeProperties stripeProperties;
    private final PaymentSagaOrchestrator paymentSagaOrchestrator;
    private final ProcessedStripeEventRepository processedStripeEventRepository;

    public StripeWebhookService(
        StripeProperties stripeProperties,
        PaymentSagaOrchestrator paymentSagaOrchestrator,
        ProcessedStripeEventRepository processedStripeEventRepository
    ) {
        this.stripeProperties = stripeProperties;
        this.paymentSagaOrchestrator = paymentSagaOrchestrator;
        this.processedStripeEventRepository = processedStripeEventRepository;
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        if (stripeProperties.webhookSecret() == null || stripeProperties.webhookSecret().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe webhook secret not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeProperties.webhookSecret());
        } catch (SignatureVerificationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe signature");
        }

        if (processedStripeEventRepository.existsById(event.getId())) {
            return;
        }

        switch (event.getType()) {
            case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
            case "payment_intent.payment_failed" -> handlePaymentIntentFailed(event);
            case "payment_intent.canceled" -> handlePaymentIntentCanceled(event);
            default -> log.debug("Ignoring Stripe event type {}", event.getType());
        }

        ProcessedStripeEvent processed = new ProcessedStripeEvent();
        processed.setStripeEventId(event.getId());
        processed.setEventType(event.getType());
        processedStripeEventRepository.save(processed);
    }

    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent intent = deserializePaymentIntent(event);
        if (intent == null) {
            log.warn("Stripe payment_intent.succeeded missing PaymentIntent payload");
            return;
        }

        paymentSagaOrchestrator.completeFromStripeWebhook(intent.getId());
    }

    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent intent = deserializePaymentIntent(event);
        if (intent == null) {
            return;
        }

        String reason = intent.getLastPaymentError() != null
            ? intent.getLastPaymentError().getMessage()
            : "Stripe payment failed";
        paymentSagaOrchestrator.failFromStripeWebhook(intent.getId(), reason);
    }

    private void handlePaymentIntentCanceled(Event event) {
        PaymentIntent intent = deserializePaymentIntent(event);
        if (intent == null) {
            return;
        }

        paymentSagaOrchestrator.failFromStripeWebhook(intent.getId(), "Payment canceled");
    }

    private PaymentIntent deserializePaymentIntent(Event event) {
        return event.getDataObjectDeserializer()
            .getObject()
            .filter(PaymentIntent.class::isInstance)
            .map(PaymentIntent.class::cast)
            .orElse(null);
    }
}
