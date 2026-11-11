package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "recruiter_oauth_states")
public class RecruiterOAuthState {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String stateToken;

    @Column(nullable = false)
    private UUID recruiterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RecruiterIntegrationProvider provider;

    @Column(nullable = false)
    private Instant expiresAt;

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

    public String getStateToken() {
        return stateToken;
    }

    public void setStateToken(String stateToken) {
        this.stateToken = stateToken;
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

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
