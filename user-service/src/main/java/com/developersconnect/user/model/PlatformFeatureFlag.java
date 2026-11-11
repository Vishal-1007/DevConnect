package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "platform_feature_flags")
public class PlatformFeatureFlag {

    @Id
    @Column(name = "feature_key", length = 64)
    private String featureKey;

    @Column(nullable = false, length = 128)
    private String label;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private boolean critical;

    @Column(length = 64)
    private String updatedByUsername;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public String getFeatureKey() {
        return featureKey;
    }

    public void setFeatureKey(String featureKey) {
        this.featureKey = featureKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isCritical() {
        return critical;
    }

    public void setCritical(boolean critical) {
        this.critical = critical;
    }

    public String getUpdatedByUsername() {
        return updatedByUsername;
    }

    public void setUpdatedByUsername(String updatedByUsername) {
        this.updatedByUsername = updatedByUsername;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
