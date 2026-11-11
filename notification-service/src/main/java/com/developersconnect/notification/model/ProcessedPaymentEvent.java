package com.developersconnect.notification.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "processed_payment_events")
public class ProcessedPaymentEvent {

    @Id
    private UUID eventId;

    @Column(nullable = false)
    private UUID paymentId;

    @Column(nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false)
    private Instant processedAt;

    @PrePersist
    void onCreate() {
        this.processedAt = Instant.now();
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(UUID paymentId) {
        this.paymentId = paymentId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
}
