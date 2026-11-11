package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "call_sessions")
public class CallSession {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false, length = 16)
    private String callType;

    @Column(nullable = false)
    private Instant startTime;

    private Instant endTime;

    @Column(nullable = false)
    private long durationSeconds;

    @Column(nullable = false)
    private long amountDeductedCents;

    @Column(nullable = false)
    private long mentorEarningCents;

    @Column(nullable = false)
    private long platformCommissionCents;

    @Column(nullable = false)
    private long pricePerMinuteCents;

    @Column(nullable = false)
    private long minutesBilled;

    private Instant lastBilledAt;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
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

    public String getCallType() {
        return callType;
    }

    public void setCallType(String callType) {
        this.callType = callType;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public long getAmountDeductedCents() {
        return amountDeductedCents;
    }

    public void setAmountDeductedCents(long amountDeductedCents) {
        this.amountDeductedCents = amountDeductedCents;
    }

    public long getMentorEarningCents() {
        return mentorEarningCents;
    }

    public void setMentorEarningCents(long mentorEarningCents) {
        this.mentorEarningCents = mentorEarningCents;
    }

    public long getPlatformCommissionCents() {
        return platformCommissionCents;
    }

    public void setPlatformCommissionCents(long platformCommissionCents) {
        this.platformCommissionCents = platformCommissionCents;
    }

    public long getPricePerMinuteCents() {
        return pricePerMinuteCents;
    }

    public void setPricePerMinuteCents(long pricePerMinuteCents) {
        this.pricePerMinuteCents = pricePerMinuteCents;
    }

    public long getMinutesBilled() {
        return minutesBilled;
    }

    public void setMinutesBilled(long minutesBilled) {
        this.minutesBilled = minutesBilled;
    }

    public Instant getLastBilledAt() {
        return lastBilledAt;
    }

    public void setLastBilledAt(Instant lastBilledAt) {
        this.lastBilledAt = lastBilledAt;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
