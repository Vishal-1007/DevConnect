package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "platform_user_warnings")
public class PlatformUserWarning {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID accountId;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, length = 16)
    private String severity = "medium";

    @Column(nullable = false)
    private UUID issuedById;

    @Column(nullable = false, length = 64)
    private String issuedByUsername;

    private UUID sourceReportId;

    @Column(nullable = false)
    private boolean acknowledged;

    private Instant acknowledgedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public void setAccountId(UUID accountId) {
        this.accountId = accountId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public UUID getIssuedById() {
        return issuedById;
    }

    public void setIssuedById(UUID issuedById) {
        this.issuedById = issuedById;
    }

    public String getIssuedByUsername() {
        return issuedByUsername;
    }

    public void setIssuedByUsername(String issuedByUsername) {
        this.issuedByUsername = issuedByUsername;
    }

    public UUID getSourceReportId() {
        return sourceReportId;
    }

    public void setSourceReportId(UUID sourceReportId) {
        this.sourceReportId = sourceReportId;
    }

    public boolean isAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(boolean acknowledged) {
        this.acknowledged = acknowledged;
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(Instant acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
