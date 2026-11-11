package com.developersconnect.payment.messaging;

import com.developersconnect.events.payment.PaymentEventEnvelope;
import com.developersconnect.events.payment.PaymentEventType;
import com.developersconnect.payment.model.OutboxEvent;
import com.developersconnect.payment.model.Payment;
import com.developersconnect.payment.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentOutboxWriter {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public PaymentOutboxWriter(OutboxEventRepository outboxEventRepository, ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void enqueue(Payment payment, PaymentEventType eventType, UUID correlationId, String failureReason) {
        PaymentEventEnvelope envelope = new PaymentEventEnvelope(
            UUID.randomUUID(),
            eventType,
            PaymentEventEnvelope.CURRENT_SCHEMA_VERSION,
            Instant.now(),
            correlationId,
            payment.getId(),
            payment.getUserId(),
            payment.getAmount(),
            payment.getCurrency(),
            payment.getStatus().name(),
            payment.getDescription(),
            failureReason
        );

        OutboxEvent outboxEvent = new OutboxEvent();
        outboxEvent.setAggregateId(payment.getId());
        outboxEvent.setEventType(eventType.name());
        outboxEvent.setPayloadJson(toJson(envelope));
        outboxEventRepository.save(outboxEvent);
    }

    private String toJson(PaymentEventEnvelope envelope) {
        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize payment event", ex);
        }
    }
}
