package com.developersconnect.payment.model;

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
@Table(name = "recruiter_subscriptions")
public class RecruiterSubscription {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID recruiterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RecruiterPlanType planType = RecruiterPlanType.FREE;

    @Column(nullable = false)
    private Instant startDate;

    private Instant expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RecruiterSubscriptionStatus status = RecruiterSubscriptionStatus.ACTIVE;

    @Column(nullable = false)
    private int activeJobLimit;

    @Column(nullable = false)
    private int candidateSearchLimit;

    @Column(nullable = false)
    private int messageLimit;

    @Column(nullable = false)
    private int recruiterSeatLimit;

    @Column(nullable = false)
    private int aiReportLimit;

    @Column(nullable = false)
    private int usedJobPosts;

    @Column(nullable = false)
    private int usedSearches;

    @Column(nullable = false)
    private int usedMessages;

    @Column(nullable = false)
    private int usedAiReports;

    private Instant usageResetAt;

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
        if (startDate == null) {
            startDate = now;
        }
        if (usageResetAt == null) {
            usageResetAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRecruiterId() {
        return recruiterId;
    }

    public void setRecruiterId(UUID recruiterId) {
        this.recruiterId = recruiterId;
    }

    public RecruiterPlanType getPlanType() {
        return planType;
    }

    public void setPlanType(RecruiterPlanType planType) {
        this.planType = planType;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public RecruiterSubscriptionStatus getStatus() {
        return status;
    }

    public void setStatus(RecruiterSubscriptionStatus status) {
        this.status = status;
    }

    public int getActiveJobLimit() {
        return activeJobLimit;
    }

    public void setActiveJobLimit(int activeJobLimit) {
        this.activeJobLimit = activeJobLimit;
    }

    public int getCandidateSearchLimit() {
        return candidateSearchLimit;
    }

    public void setCandidateSearchLimit(int candidateSearchLimit) {
        this.candidateSearchLimit = candidateSearchLimit;
    }

    public int getMessageLimit() {
        return messageLimit;
    }

    public void setMessageLimit(int messageLimit) {
        this.messageLimit = messageLimit;
    }

    public int getRecruiterSeatLimit() {
        return recruiterSeatLimit;
    }

    public void setRecruiterSeatLimit(int recruiterSeatLimit) {
        this.recruiterSeatLimit = recruiterSeatLimit;
    }

    public int getAiReportLimit() {
        return aiReportLimit;
    }

    public void setAiReportLimit(int aiReportLimit) {
        this.aiReportLimit = aiReportLimit;
    }

    public int getUsedJobPosts() {
        return usedJobPosts;
    }

    public void setUsedJobPosts(int usedJobPosts) {
        this.usedJobPosts = usedJobPosts;
    }

    public int getUsedSearches() {
        return usedSearches;
    }

    public void setUsedSearches(int usedSearches) {
        this.usedSearches = usedSearches;
    }

    public int getUsedMessages() {
        return usedMessages;
    }

    public void setUsedMessages(int usedMessages) {
        this.usedMessages = usedMessages;
    }

    public int getUsedAiReports() {
        return usedAiReports;
    }

    public void setUsedAiReports(int usedAiReports) {
        this.usedAiReports = usedAiReports;
    }

    public Instant getUsageResetAt() {
        return usageResetAt;
    }

    public void setUsageResetAt(Instant usageResetAt) {
        this.usageResetAt = usageResetAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
