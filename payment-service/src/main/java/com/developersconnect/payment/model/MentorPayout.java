package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "mentor_payouts")
public class MentorPayout {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 16)
    private String payoutCode;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false, length = 200)
    private String mentorDisplayName;

    @Column(nullable = false)
    private long amountCents;

    @Column(nullable = false, length = 32)
    private String status = "pending";

    private UUID linkedTransactionId;

    @Column(length = 500)
    private String failureReason;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant completedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getPayoutCode() {
        return payoutCode;
    }

    public void setPayoutCode(String payoutCode) {
        this.payoutCode = payoutCode;
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public String getMentorDisplayName() {
        return mentorDisplayName;
    }

    public void setMentorDisplayName(String mentorDisplayName) {
        this.mentorDisplayName = mentorDisplayName;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getLinkedTransactionId() {
        return linkedTransactionId;
    }

    public void setLinkedTransactionId(UUID linkedTransactionId) {
        this.linkedTransactionId = linkedTransactionId;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
