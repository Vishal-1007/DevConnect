package com.developersconnect.payment.saga;

import com.developersconnect.events.payment.PaymentEventType;
import com.developersconnect.payment.config.PaymentGatewayProperties;
import com.developersconnect.payment.dto.CreatePaymentIntentRequest;
import com.developersconnect.payment.dto.PaymentResponse;
import com.developersconnect.payment.gateway.PaymentGateway;
import com.developersconnect.payment.messaging.PaymentOutboxWriter;
import com.developersconnect.payment.model.Payment;
import com.developersconnect.payment.model.PaymentMode;
import com.developersconnect.payment.model.PaymentStatus;
import com.developersconnect.payment.model.SagaInstance;
import com.developersconnect.payment.model.SagaState;
import com.developersconnect.payment.model.SagaStepLog;
import com.developersconnect.payment.repository.PaymentRepository;
import com.developersconnect.payment.repository.SagaInstanceRepository;
import com.developersconnect.payment.repository.SagaStepLogRepository;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Orchestrated payment saga with two-phase commit semantics:
 * <ul>
 *   <li>Funds are only <strong>captured</strong> (debited) on successful {@code CAPTURE} — not at authorize.</li>
 *   <li>Authorize holds/reserves with the PSP; capture moves money.</li>
 *   <li>Capture failure → {@code COMPENSATING} → {@code voidAuthorization} → {@code FAILED} (no debit).</li>
 *   <li>Authorize failure → void any PSP reference → {@code FAILED} (no debit).</li>
 * </ul>
 * Flow: STARTED → AUTHORIZE → AUTHORIZED → CAPTURE → COMPLETED (+ Kafka outbox).
 * Use {@link #checkout} for mock/UPI/wallet single-request checkout in one DB transaction.
 */
@Service
public class PaymentSagaOrchestrator {

    private static final String SAGA_TYPE = "PAYMENT_PROCESSING";

    private final PaymentRepository paymentRepository;
    private final SagaInstanceRepository sagaInstanceRepository;
    private final SagaStepLogRepository sagaStepLogRepository;
    private final PaymentGateway paymentGateway;
    private final PaymentOutboxWriter paymentOutboxWriter;
    private final PaymentGatewayProperties gatewayProperties;

    public PaymentSagaOrchestrator(
        PaymentRepository paymentRepository,
        SagaInstanceRepository sagaInstanceRepository,
        SagaStepLogRepository sagaStepLogRepository,
        PaymentGateway paymentGateway,
        PaymentOutboxWriter paymentOutboxWriter,
        PaymentGatewayProperties gatewayProperties
    ) {
        this.paymentRepository = paymentRepository;
        this.sagaInstanceRepository = sagaInstanceRepository;
        this.sagaStepLogRepository = sagaStepLogRepository;
        this.paymentGateway = paymentGateway;
        this.paymentOutboxWriter = paymentOutboxWriter;
        this.gatewayProperties = gatewayProperties;
    }

    @Transactional
    public PaymentResponse createPaymentIntent(UUID userId, CreatePaymentIntentRequest request) {
        String idempotencyKey = resolveIdempotencyKey(userId, request.idempotencyKey());

        return paymentRepository.findByIdempotencyKey(idempotencyKey)
            .map(existing -> toResponse(existing, loadSaga(existing.getSagaId()), null))
            .orElseGet(() -> startSaga(userId, request, idempotencyKey));
    }

    /**
     * Single-shot checkout: authorize then capture in one {@code @Transactional} boundary.
     * On capture failure, compensation voids the authorization so funds are not debited.
     */
    @Transactional
    public PaymentResponse checkout(UUID userId, CreatePaymentIntentRequest request, String simulatedOutcome) {
        PaymentResponse authorized = createPaymentIntent(userId, request);
        if (authorized.status() != PaymentStatus.AUTHORIZED) {
            return authorized;
        }
        return confirmPayment(userId, authorized.id(), simulatedOutcome);
    }

    @Transactional
    public PaymentResponse confirmPayment(UUID userId, UUID paymentId, String simulatedOutcome) {
        Payment payment = loadOwnedPayment(userId, paymentId);

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return toResponse(payment, loadSaga(payment.getSagaId()), null);
        }

        if (payment.getStatus() != PaymentStatus.AUTHORIZED) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Payment must be authorized before confirmation. Current status: " + payment.getStatus()
            );
        }

        SagaInstance saga = loadSaga(payment.getSagaId());
        logStep(saga.getId(), "CAPTURE", "STARTED", "Capturing authorized funds");

        PaymentGateway.CaptureResult captureResult = resolveCaptureResult(payment, simulatedOutcome);

        if (captureResult.success()) {
            return markCompleted(payment, saga, captureResult.message());
        }

        return compensateFailedCapture(payment, saga, captureResult.message());
    }

    @Transactional
    public void completeFromStripeWebhook(String paymentIntentId) {
        Payment payment = paymentRepository.findByProviderReference(paymentIntentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for intent"));

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return;
        }

        if (payment.getStatus() != PaymentStatus.AUTHORIZED) {
            return;
        }

        SagaInstance saga = loadSaga(payment.getSagaId());
        PaymentGateway.CaptureResult captureResult = paymentGateway.capture(
            payment.getProviderReference(),
            payment.getAmount(),
            payment.getCurrency()
        );

        if (captureResult.success()) {
            markCompleted(payment, saga, "Completed via Stripe webhook");
            return;
        }

        compensateFailedCapture(payment, saga, captureResult.message());
    }

    @Transactional
    public void failFromStripeWebhook(String paymentIntentId, String reason) {
        paymentRepository.findByProviderReference(paymentIntentId).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.COMPLETED || payment.getStatus() == PaymentStatus.FAILED) {
                return;
            }
            SagaInstance saga = loadSaga(payment.getSagaId());
            compensateFailedCapture(payment, saga, reason != null ? reason : "Stripe payment failed");
        });
    }

    @Transactional(readOnly = true)
    public Optional<Payment> findByProviderReference(String providerReference) {
        return paymentRepository.findByProviderReference(providerReference);
    }

    private PaymentResponse startSaga(UUID userId, CreatePaymentIntentRequest request, String idempotencyKey) {
        UUID correlationId = UUID.randomUUID();

        SagaInstance saga = new SagaInstance();
        saga.setSagaType(SAGA_TYPE);
        saga.setState(SagaState.STARTED);
        saga.setCurrentStep("INIT");
        saga.setCorrelationId(correlationId);
        saga = sagaInstanceRepository.save(saga);

        Payment payment = new Payment();
        payment.setUserId(userId);
        payment.setSagaId(saga.getId());
        payment.setAmount(request.amount());
        payment.setCurrency(request.currency().toUpperCase(Locale.ROOT));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setDescription(request.description());
        PaymentMode paymentMode = PaymentMode.resolve(request.paymentMode(), request.paymentMethod());
        ensureGatewaySupportsMode(paymentMode);
        payment.setPaymentMethod(paymentMode.name());
        payment.setIdempotencyKey(idempotencyKey);
        payment = paymentRepository.save(payment);

        saga.setPaymentId(payment.getId());
        sagaInstanceRepository.save(saga);

        logStep(saga.getId(), "INIT", "COMPLETED", "Payment intent created");

        return authorizePayment(payment, saga);
    }

    private PaymentResponse authorizePayment(Payment payment, SagaInstance saga) {
        logStep(saga.getId(), "AUTHORIZE", "STARTED", "Authorizing with payment gateway");

        String providerReference = null;
        try {
            PaymentGateway.AuthorizationResult authorization = paymentGateway.authorize(
                payment.getId(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getDescription(),
                payment.getPaymentMethod()
            );

            providerReference = authorization.providerReference();
            payment.setProviderReference(providerReference);
            payment.setStatus(PaymentStatus.AUTHORIZED);
            paymentRepository.save(payment);

            saga.setState(SagaState.AUTHORIZED);
            saga.setCurrentStep("AUTHORIZED");
            sagaInstanceRepository.save(saga);

            logStep(
                saga.getId(),
                "AUTHORIZE",
                "COMPLETED",
                "Authorization reference " + providerReference
            );
            return toResponse(payment, saga, authorization.clientSecret());
        } catch (Exception ex) {
            return failAuthorization(payment, saga, ex.getMessage(), providerReference);
        }
    }

    private PaymentResponse failAuthorization(
        Payment payment,
        SagaInstance saga,
        String failureReason,
        String providerReference
    ) {
        if (providerReference != null) {
            paymentGateway.voidAuthorization(providerReference);
            payment.setProviderReference(providerReference);
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);

        saga.setState(SagaState.COMPENSATED);
        saga.setCurrentStep("FAILED");
        sagaInstanceRepository.save(saga);
        logStep(saga.getId(), "AUTHORIZE", "FAILED", failureReason);

        paymentOutboxWriter.enqueue(payment, PaymentEventType.PAYMENT_FAILED, saga.getCorrelationId(), failureReason);
        return toResponse(payment, saga, null);
    }

    private PaymentResponse markCompleted(Payment payment, SagaInstance saga, String message) {
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setCompletedAt(Instant.now());
        paymentRepository.save(payment);

        saga.setState(SagaState.COMPLETED);
        saga.setCurrentStep("COMPLETED");
        sagaInstanceRepository.save(saga);
        logStep(saga.getId(), "CAPTURE", "COMPLETED", message);

        paymentOutboxWriter.enqueue(payment, PaymentEventType.PAYMENT_COMPLETED, saga.getCorrelationId(), null);
        return toResponse(payment, saga, null);
    }

    private PaymentResponse compensateFailedCapture(Payment payment, SagaInstance saga, String failureReason) {
        saga.setState(SagaState.COMPENSATING);
        saga.setCurrentStep("COMPENSATE");
        sagaInstanceRepository.save(saga);
        logStep(saga.getId(), "COMPENSATE", "STARTED", failureReason);

        if (payment.getProviderReference() != null) {
            paymentGateway.voidAuthorization(payment.getProviderReference());
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);

        saga.setState(SagaState.COMPENSATED);
        saga.setCurrentStep("FAILED");
        sagaInstanceRepository.save(saga);
        logStep(saga.getId(), "COMPENSATE", "COMPLETED", "Authorization voided");

        paymentOutboxWriter.enqueue(payment, PaymentEventType.PAYMENT_FAILED, saga.getCorrelationId(), failureReason);
        return toResponse(payment, saga, null);
    }

    private PaymentGateway.CaptureResult resolveCaptureResult(Payment payment, String simulatedOutcome) {
        if ("mock".equalsIgnoreCase(gatewayProperties.gatewayProvider())
            && "FAIL".equalsIgnoreCase(simulatedOutcome)) {
            return new PaymentGateway.CaptureResult(false, "Simulated payment failure");
        }
        return paymentGateway.capture(payment.getProviderReference(), payment.getAmount(), payment.getCurrency());
    }

    private Payment loadOwnedPayment(UUID userId, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return payment;
    }

    private SagaInstance loadSaga(UUID sagaId) {
        return sagaInstanceRepository.findById(sagaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Saga not found"));
    }

    private String resolveIdempotencyKey(UUID userId, String providedKey) {
        if (providedKey != null && !providedKey.isBlank()) {
            return providedKey.trim();
        }
        return userId + ":" + UUID.randomUUID();
    }

    private void ensureGatewaySupportsMode(PaymentMode paymentMode) {
        if ("stripe".equalsIgnoreCase(gatewayProperties.gatewayProvider()) && paymentMode != PaymentMode.CARD) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Stripe checkout supports card payments only. "
                    + "Select Card or switch to the mock gateway for UPI and wallet modes."
            );
        }
    }

    private void logStep(UUID sagaId, String stepName, String status, String message) {
        SagaStepLog log = new SagaStepLog();
        log.setSagaId(sagaId);
        log.setStepName(stepName);
        log.setStatus(status);
        log.setMessage(message);
        sagaStepLogRepository.save(log);
    }

    public PaymentResponse toResponse(Payment payment, SagaInstance saga, String clientSecret) {
        return new PaymentResponse(
            payment.getId(),
            payment.getUserId(),
            payment.getSagaId(),
            payment.getAmount(),
            payment.getCurrency(),
            payment.getStatus(),
            payment.getDescription(),
            payment.getPaymentMethod(),
            payment.getProviderReference(),
            saga.getState(),
            payment.getFailureReason(),
            clientSecret,
            gatewayProperties.gatewayProvider(),
            payment.getCreatedAt(),
            payment.getUpdatedAt(),
            payment.getCompletedAt()
        );
    }
}
