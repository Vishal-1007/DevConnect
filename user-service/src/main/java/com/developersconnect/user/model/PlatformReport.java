package com.developersconnect.user.model;

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
@Table(name = "platform_reports")
public class PlatformReport {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 16)
    private String reportCode;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(nullable = false, length = 32)
    private String targetType;

    private UUID targetId;

    @Column(nullable = false, length = 500)
    private String targetSummary;

    private UUID targetAccountId;

    @Column(nullable = false)
    private UUID reporterId;

    @Column(nullable = false, length = 64)
    private String reporterUsername;

    @Column(length = 2000)
    private String details;

    @Column(nullable = false, length = 32)
    private String status = "pending";

    @Column(length = 32)
    private String adminAction;

    @Column(length = 1000)
    private String adminNote;

    private UUID reviewedById;

    @Column(length = 64)
    private String reviewedByUsername;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant resolvedAt;

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

    public String getReportCode() {
        return reportCode;
    }

    public void setReportCode(String reportCode) {
        this.reportCode = reportCode;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    public String getTargetSummary() {
        return targetSummary;
    }

    public void setTargetSummary(String targetSummary) {
        this.targetSummary = targetSummary;
    }

    public UUID getTargetAccountId() {
        return targetAccountId;
    }

    public void setTargetAccountId(UUID targetAccountId) {
        this.targetAccountId = targetAccountId;
    }

    public UUID getReporterId() {
        return reporterId;
    }

    public void setReporterId(UUID reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterUsername() {
        return reporterUsername;
    }

    public void setReporterUsername(String reporterUsername) {
        this.reporterUsername = reporterUsername;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminAction() {
        return adminAction;
    }

    public void setAdminAction(String adminAction) {
        this.adminAction = adminAction;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public UUID getReviewedById() {
        return reviewedById;
    }

    public void setReviewedById(UUID reviewedById) {
        this.reviewedById = reviewedById;
    }

    public String getReviewedByUsername() {
        return reviewedByUsername;
    }

    public void setReviewedByUsername(String reviewedByUsername) {
        this.reviewedByUsername = reviewedByUsername;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
