package com.developersconnect.user.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Composite key lives in {@link CommunityEventRegistrationId}. */
@Entity
@Table(name = "community_event_registrations")
@IdClass(CommunityEventRegistrationId.class)
public class CommunityEventRegistration {

    @Id
    private UUID eventId;

    @Id
    private UUID userId;

    @Column(nullable = false)
    private Instant registeredAt;

    @Column(nullable = false)
    private boolean attended = false;

    @Column(name = "attended_at")
    private Instant attendedAt;

    @Column(name = "payment_status", nullable = false, length = 16)
    private String paymentStatus = "free";

    @Column(name = "amount_paid_cents", nullable = false)
    private int amountPaidCents = 0;

    @PrePersist
    void onCreate() {
        registeredAt = Instant.now();
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

    public Instant getRegisteredAt() {
        return registeredAt;
    }

    public boolean isAttended() {
        return attended;
    }

    public void setAttended(boolean attended) {
        this.attended = attended;
    }

    public Instant getAttendedAt() {
        return attendedAt;
    }

    public void setAttendedAt(Instant attendedAt) {
        this.attendedAt = attendedAt;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public int getAmountPaidCents() {
        return amountPaidCents;
    }

    public void setAmountPaidCents(int amountPaidCents) {
        this.amountPaidCents = amountPaidCents;
    }
}
