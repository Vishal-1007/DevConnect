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
@Table(name = "platform_user_bans")
public class PlatformUserBan {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID accountId;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 32)
    private String banType;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false)
    private UUID bannedById;

    @Column(nullable = false, length = 64)
    private String bannedByUsername;

    private UUID sourceReportId;

    @Column(nullable = false)
    private Instant bannedAt;

    private Instant expiresAt;

    private Instant restoredAt;

    @Column(length = 500)
    private String restoreNote;

    @Column(nullable = false)
    private boolean active = true;

    @PrePersist
    void onCreate() {
        if (bannedAt == null) {
            bannedAt = Instant.now();
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

    public String getBanType() {
        return banType;
    }

    public void setBanType(String banType) {
        this.banType = banType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public UUID getBannedById() {
        return bannedById;
    }

    public void setBannedById(UUID bannedById) {
        this.bannedById = bannedById;
    }

    public String getBannedByUsername() {
        return bannedByUsername;
    }

    public void setBannedByUsername(String bannedByUsername) {
        this.bannedByUsername = bannedByUsername;
    }

    public UUID getSourceReportId() {
        return sourceReportId;
    }

    public void setSourceReportId(UUID sourceReportId) {
        this.sourceReportId = sourceReportId;
    }

    public Instant getBannedAt() {
        return bannedAt;
    }

    public void setBannedAt(Instant bannedAt) {
        this.bannedAt = bannedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getRestoredAt() {
        return restoredAt;
    }

    public void setRestoredAt(Instant restoredAt) {
        this.restoredAt = restoredAt;
    }

    public String getRestoreNote() {
        return restoreNote;
    }

    public void setRestoreNote(String restoreNote) {
        this.restoreNote = restoreNote;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
