package com.developersconnect.payment.messaging;

import com.developersconnect.events.payment.PaymentTopics;
import com.developersconnect.payment.model.OutboxEvent;
import com.developersconnect.payment.repository.OutboxEventRepository;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.payment.outbox-poll-ms:2000}")
    private long pollMs;

    public OutboxPublisher(
        OutboxEventRepository outboxEventRepository,
        KafkaTemplate<String, String> kafkaTemplate
    ) {
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelayString = "${app.payment.outbox-poll-ms:2000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxEventRepository.findUnpublished();
        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send(
                    PaymentTopics.PAYMENT_EVENTS,
                    event.getAggregateId().toString(),
                    event.getPayloadJson()
                ).get();
                event.setPublishedAt(Instant.now());
                outboxEventRepository.save(event);
                log.info("Published outbox event {} type {}", event.getId(), event.getEventType());
            } catch (Exception ex) {
                log.warn("Failed to publish outbox event {} — will retry: {}", event.getId(), ex.getMessage());
                break;
            }
        }
    }
}
