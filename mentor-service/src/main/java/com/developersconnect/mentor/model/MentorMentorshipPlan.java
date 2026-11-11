package com.developersconnect.mentor.model;

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
@Table(name = "mentor_mentorship_plans")
public class MentorMentorshipPlan {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 32)
    private String planType = "one_on_one";

    @Column(nullable = false, length = 32)
    private String billingType = "one_time";

    @Column(nullable = false)
    private int priceCents;

    @Column(nullable = false)
    private int sessionLimit = 1;

    @Column(nullable = false)
    private int durationMinutes = 60;

    @Column(length = 64)
    private String durationLabel;

    @Column(nullable = false)
    private boolean premiumSupport;

    @Column(nullable = false)
    private boolean popular;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int sortOrder;

    @Column(columnDefinition = "TEXT")
    private String features;

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
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    public String getBillingType() { return billingType; }
    public void setBillingType(String billingType) { this.billingType = billingType; }
    public int getPriceCents() { return priceCents; }
    public void setPriceCents(int priceCents) { this.priceCents = priceCents; }
    public int getSessionLimit() { return sessionLimit; }
    public void setSessionLimit(int sessionLimit) { this.sessionLimit = sessionLimit; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getDurationLabel() { return durationLabel; }
    public void setDurationLabel(String durationLabel) { this.durationLabel = durationLabel; }
    public boolean isPremiumSupport() { return premiumSupport; }
    public void setPremiumSupport(boolean premiumSupport) { this.premiumSupport = premiumSupport; }
    public boolean isPopular() { return popular; }
    public void setPopular(boolean popular) { this.popular = popular; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
