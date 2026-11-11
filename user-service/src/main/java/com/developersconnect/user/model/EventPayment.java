package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "event_payments")
public class EventPayment {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "mentor_id", nullable = false)
    private UUID mentorId;

    @Column(name = "payment_id", nullable = false, unique = true)
    private UUID paymentId;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(name = "mentor_share_cents", nullable = false)
    private int mentorShareCents;

    @Column(name = "platform_share_cents", nullable = false)
    private int platformShareCents;

    @Column(nullable = false, length = 16)
    private String status = "completed";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public UUID getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(UUID paymentId) {
        this.paymentId = paymentId;
    }

    public int getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(int amountCents) {
        this.amountCents = amountCents;
    }

    public int getMentorShareCents() {
        return mentorShareCents;
    }

    public void setMentorShareCents(int mentorShareCents) {
        this.mentorShareCents = mentorShareCents;
    }

    public int getPlatformShareCents() {
        return platformShareCents;
    }

    public void setPlatformShareCents(int platformShareCents) {
        this.platformShareCents = platformShareCents;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
