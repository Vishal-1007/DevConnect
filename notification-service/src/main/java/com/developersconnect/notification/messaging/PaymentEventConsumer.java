package com.developersconnect.notification.messaging;

import com.developersconnect.events.payment.PaymentEventEnvelope;
import com.developersconnect.events.payment.PaymentEventType;
import com.developersconnect.events.payment.PaymentTopics;
import com.developersconnect.notification.dto.CreateNotificationRequest;
import com.developersconnect.notification.model.ProcessedPaymentEvent;
import com.developersconnect.notification.repository.ProcessedPaymentEventRepository;
import com.developersconnect.notification.service.NotificationService;
import java.math.RoundingMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class PaymentEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventConsumer.class);

    private final NotificationService notificationService;
    private final ProcessedPaymentEventRepository processedPaymentEventRepository;

    public PaymentEventConsumer(
        NotificationService notificationService,
        ProcessedPaymentEventRepository processedPaymentEventRepository
    ) {
        this.notificationService = notificationService;
        this.processedPaymentEventRepository = processedPaymentEventRepository;
    }

    @KafkaListener(
        topics = PaymentTopics.PAYMENT_EVENTS,
        groupId = "${spring.kafka.consumer.group-id:notification-service}",
        containerFactory = "paymentKafkaListenerContainerFactory"
    )
    @Transactional
    public void onPaymentEvent(PaymentEventEnvelope event) {
        if (!isValidEvent(event)) {
            log.warn("Skipping invalid payment event payload");
            return;
        }

        if (processedPaymentEventRepository.existsById(event.eventId())) {
            return;
        }

        CreateNotificationRequest request = toNotificationRequest(event);
        notificationService.create(request);

        ProcessedPaymentEvent processed = new ProcessedPaymentEvent();
        processed.setEventId(event.eventId());
        processed.setPaymentId(event.paymentId());
        processed.setEventType(event.eventType().name());
        processedPaymentEventRepository.save(processed);

        log.info(
            "Created notification for payment {} event {}",
            event.paymentId(),
            event.eventType()
        );
    }

    private boolean isValidEvent(PaymentEventEnvelope event) {
        return event != null
            && event.eventId() != null
            && event.paymentId() != null
            && event.userId() != null
            && event.eventType() != null
            && event.amount() != null
            && event.currency() != null
            && event.description() != null;
    }

    private CreateNotificationRequest toNotificationRequest(PaymentEventEnvelope event) {
        String amount = event.amount().setScale(2, RoundingMode.HALF_UP) + " " + event.currency();

        if (event.eventType() == PaymentEventType.PAYMENT_COMPLETED) {
            return new CreateNotificationRequest(
                event.userId(),
                "payment_success",
                "Payment successful",
                "Your payment of " + amount + " for \"" + event.description() + "\" was completed."
            );
        }

        if (event.eventType() == PaymentEventType.PAYMENT_FAILED) {
            String reason = event.failureReason() != null ? event.failureReason() : "Payment could not be completed.";
            return new CreateNotificationRequest(
                event.userId(),
                "payment_failed",
                "Payment failed",
                "Your payment of " + amount + " failed. " + reason
            );
        }

        return new CreateNotificationRequest(
            event.userId(),
            "payment_refunded",
            "Payment refunded",
            "Your payment of " + amount + " has been refunded."
        );
    }
}
