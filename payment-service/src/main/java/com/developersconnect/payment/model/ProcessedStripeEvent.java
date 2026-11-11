package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "processed_stripe_events")
public class ProcessedStripeEvent {

    @Id
    @Column(length = 128)
    private String stripeEventId;

    @Column(nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false)
    private Instant processedAt;

    @PrePersist
    void onCreate() {
        this.processedAt = Instant.now();
    }

    public String getStripeEventId() {
        return stripeEventId;
    }

    public void setStripeEventId(String stripeEventId) {
        this.stripeEventId = stripeEventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
}
