package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "mock_interview_requests")
public class MockInterviewRequest {

    public enum Status {
        PENDING, ACCEPTED, REJECTED, COMPLETED
    }

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID learnerId;

    @Column(nullable = false, length = 128)
    private String learnerName;

    @Column(nullable = false)
    private UUID interviewerId;

    @Column(nullable = false, length = 64)
    private String interviewType;

    @Column(nullable = false, length = 16)
    private String difficulty;

    @Column(nullable = false, length = 128)
    private String focusTopic;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.PENDING;

    @Column
    private Instant scheduledAt;

    @Column
    private Instant slotEndAt;

    @Column
    private Integer durationMinutes;

    @Column
    private UUID paymentId;

    @Column
    private Integer amountCents;

    @Column
    private Integer platformFeeCents;

    @Column(length = 16)
    private String paymentStatus;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public String getLearnerName() { return learnerName; }
    public void setLearnerName(String learnerName) { this.learnerName = learnerName; }
    public UUID getInterviewerId() { return interviewerId; }
    public void setInterviewerId(UUID interviewerId) { this.interviewerId = interviewerId; }
    public String getInterviewType() { return interviewType; }
    public void setInterviewType(String interviewType) { this.interviewType = interviewType; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getFocusTopic() { return focusTopic; }
    public void setFocusTopic(String focusTopic) { this.focusTopic = focusTopic; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public Instant getSlotEndAt() { return slotEndAt; }
    public void setSlotEndAt(Instant slotEndAt) { this.slotEndAt = slotEndAt; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public Integer getAmountCents() { return amountCents; }
    public void setAmountCents(Integer amountCents) { this.amountCents = amountCents; }
    public Integer getPlatformFeeCents() { return platformFeeCents; }
    public void setPlatformFeeCents(Integer platformFeeCents) { this.platformFeeCents = platformFeeCents; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
