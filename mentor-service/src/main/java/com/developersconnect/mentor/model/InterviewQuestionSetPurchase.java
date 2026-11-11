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
@Table(name = "interview_question_set_purchases")
public class InterviewQuestionSetPurchase {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "question_set_id", nullable = false)
    private UUID questionSetId;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 8)
    private String currency = "INR";

    @Column(nullable = false, length = 16)
    private String status = "COMPLETED";

    @Column(name = "purchased_at", nullable = false)
    private Instant purchasedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    void onCreate() {
        if (purchasedAt == null) purchasedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getQuestionSetId() { return questionSetId; }
    public void setQuestionSetId(UUID questionSetId) { this.questionSetId = questionSetId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public int getAmountCents() { return amountCents; }
    public void setAmountCents(int amountCents) { this.amountCents = amountCents; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getPurchasedAt() { return purchasedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
