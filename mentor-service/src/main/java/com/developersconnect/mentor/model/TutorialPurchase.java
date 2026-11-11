package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "tutorial_purchases")
public class TutorialPurchase {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "tutorial_id", nullable = false)
    private UUID tutorialId;

    @Column(name = "payment_id", length = 120)
    private String paymentId;

    @Column(name = "payment_status", nullable = false, length = 16)
    private String paymentStatus = "COMPLETED";

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(name = "purchased_at", nullable = false)
    private Instant purchasedAt;

    @PrePersist
    void onCreate() {
        purchasedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getTutorialId() { return tutorialId; }
    public void setTutorialId(UUID tutorialId) { this.tutorialId = tutorialId; }
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public int getAmountCents() { return amountCents; }
    public void setAmountCents(int amountCents) { this.amountCents = amountCents; }
    public Instant getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(Instant purchasedAt) { this.purchasedAt = purchasedAt; }
}
