package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "recruiter_integrations",
    uniqueConstraints = @UniqueConstraint(columnNames = { "recruiter_id", "provider" })
)
public class RecruiterIntegration {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID recruiterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RecruiterIntegrationProvider provider;

    @Column(nullable = false)
    private boolean connected;

    @Column(length = 2048)
    private String accessToken;

    @Column(length = 2048)
    private String refreshToken;

    private Instant tokenExpiresAt;

    @Column(length = 320)
    private String connectedEmail;

    private Instant connectedAt;

    private Instant lastSyncAt;

    @Column(length = 4000)
    private String syncSettingsJson;

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

    public UUID getRecruiterId() {
        return recruiterId;
    }

    public void setRecruiterId(UUID recruiterId) {
        this.recruiterId = recruiterId;
    }

    public RecruiterIntegrationProvider getProvider() {
        return provider;
    }

    public void setProvider(RecruiterIntegrationProvider provider) {
        this.provider = provider;
    }

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public Instant getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public void setTokenExpiresAt(Instant tokenExpiresAt) {
        this.tokenExpiresAt = tokenExpiresAt;
    }

    public String getConnectedEmail() {
        return connectedEmail;
    }

    public void setConnectedEmail(String connectedEmail) {
        this.connectedEmail = connectedEmail;
    }

    public Instant getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(Instant connectedAt) {
        this.connectedAt = connectedAt;
    }

    public Instant getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(Instant lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }

    public String getSyncSettingsJson() {
        return syncSettingsJson;
    }

    public void setSyncSettingsJson(String syncSettingsJson) {
        this.syncSettingsJson = syncSettingsJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
