package com.developersconnect.mentor.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "mentor_applications",
    uniqueConstraints = @UniqueConstraint(columnNames = "user_id")
)
public class MentorApplication {

    public enum Status { DRAFT, PENDING, APPROVED, REJECTED, INFO_REQUESTED, SUSPENDED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(length = 100)
    private String username;

    @Column(length = 128)
    private String headline;

    @Column(length = 1024)
    private String bio;

    @Column
    private Integer hourlyRateCents;

    @Column(length = 1024)
    private String motivation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.PENDING;

    @Column(length = 100)
    private String reviewedBy;

    @Column(length = 512)
    private String reviewNote;

    @Column(name = "current_step")
    private Integer currentStep = 1;

    @Column(name = "application_data", columnDefinition = "CLOB")
    private String applicationData;

    @Column(name = "admin_internal_notes", columnDefinition = "CLOB")
    private String adminInternalNotes;

    @Column(name = "info_request_message", length = 1024)
    private String infoRequestMessage;

    @Column(name = "review_timeline", columnDefinition = "CLOB")
    private String reviewTimeline;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public Integer getHourlyRateCents() { return hourlyRateCents; }
    public void setHourlyRateCents(Integer hourlyRateCents) { this.hourlyRateCents = hourlyRateCents; }
    public String getMotivation() { return motivation; }
    public void setMotivation(String motivation) { this.motivation = motivation; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }
    public String getApplicationData() { return applicationData; }
    public void setApplicationData(String applicationData) { this.applicationData = applicationData; }
    public String getAdminInternalNotes() { return adminInternalNotes; }
    public void setAdminInternalNotes(String adminInternalNotes) { this.adminInternalNotes = adminInternalNotes; }
    public String getInfoRequestMessage() { return infoRequestMessage; }
    public void setInfoRequestMessage(String infoRequestMessage) { this.infoRequestMessage = infoRequestMessage; }
    public String getReviewTimeline() { return reviewTimeline; }
    public void setReviewTimeline(String reviewTimeline) { this.reviewTimeline = reviewTimeline; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
