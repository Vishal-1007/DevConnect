package com.developersconnect.matching.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "live_pool_members")
public class LivePoolMember {

    @Id
    private UUID userId;

    @Column(nullable = false, length = 16)
    private String role;

    @Column(name = "pool_status", nullable = false, length = 16)
    private String poolStatus;

    @Column(name = "live_enabled", nullable = false)
    private boolean liveEnabled;

    @Column(length = 512)
    private String criteria;

    @Column(name = "experience_level", length = 32)
    private String experienceLevel;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPoolStatus() {
        return poolStatus;
    }

    public void setPoolStatus(String poolStatus) {
        this.poolStatus = poolStatus;
    }

    public boolean isLiveEnabled() {
        return liveEnabled;
    }

    public void setLiveEnabled(boolean liveEnabled) {
        this.liveEnabled = liveEnabled;
    }

    public String getCriteria() {
        return criteria;
    }

    public void setCriteria(String criteria) {
        this.criteria = criteria;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
