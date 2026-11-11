package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mentor_pricing")
public class MentorPricing {

    @Id
    private UUID mentorId;

    @Column(nullable = false)
    private long audioPricePerMinuteCents;

    @Column(nullable = false)
    private long videoPricePerMinuteCents;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(nullable = false)
    private boolean instantCallEnabled = true;

    @Column(nullable = false, length = 32)
    private String status = "ACTIVE";

    @Column(length = 128)
    private String designation;

    @Column(length = 128)
    private String company;

    @Column
    private Integer experienceYears;

    @Column(length = 512)
    private String expertiseTags;

    @Column(length = 256)
    private String linkedinUrl;

    @Column(nullable = false)
    private long sessionsCompleted;

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

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public long getAudioPricePerMinuteCents() {
        return audioPricePerMinuteCents;
    }

    public void setAudioPricePerMinuteCents(long audioPricePerMinuteCents) {
        this.audioPricePerMinuteCents = audioPricePerMinuteCents;
    }

    public long getVideoPricePerMinuteCents() {
        return videoPricePerMinuteCents;
    }

    public void setVideoPricePerMinuteCents(long videoPricePerMinuteCents) {
        this.videoPricePerMinuteCents = videoPricePerMinuteCents;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isInstantCallEnabled() {
        return instantCallEnabled;
    }

    public void setInstantCallEnabled(boolean instantCallEnabled) {
        this.instantCallEnabled = instantCallEnabled;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getExpertiseTags() {
        return expertiseTags;
    }

    public void setExpertiseTags(String expertiseTags) {
        this.expertiseTags = expertiseTags;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }

    public long getSessionsCompleted() {
        return sessionsCompleted;
    }

    public void setSessionsCompleted(long sessionsCompleted) {
        this.sessionsCompleted = sessionsCompleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
