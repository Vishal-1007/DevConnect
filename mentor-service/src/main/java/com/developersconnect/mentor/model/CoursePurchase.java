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
@Table(name = "course_purchases")
public class CoursePurchase {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 16)
    private String status = "COMPLETED";

    @Column(name = "purchased_at", nullable = false)
    private Instant purchasedAt;

    @PrePersist
    void onCreate() {
        if (purchasedAt == null) purchasedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public int getAmountCents() { return amountCents; }
    public void setAmountCents(int amountCents) { this.amountCents = amountCents; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getPurchasedAt() { return purchasedAt; }
}
