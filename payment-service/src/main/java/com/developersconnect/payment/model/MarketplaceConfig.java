package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "marketplace_config")
public class MarketplaceConfig {

    @Id
    private String id = "default";

    @Column(nullable = false)
    private long minPricePerMinuteCents;

    @Column(nullable = false)
    private long maxPricePerMinuteCents;

    @Column(nullable = false)
    private double platformSharePercent;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public long getMinPricePerMinuteCents() {
        return minPricePerMinuteCents;
    }

    public void setMinPricePerMinuteCents(long minPricePerMinuteCents) {
        this.minPricePerMinuteCents = minPricePerMinuteCents;
    }

    public long getMaxPricePerMinuteCents() {
        return maxPricePerMinuteCents;
    }

    public void setMaxPricePerMinuteCents(long maxPricePerMinuteCents) {
        this.maxPricePerMinuteCents = maxPricePerMinuteCents;
    }

    public double getPlatformSharePercent() {
        return platformSharePercent;
    }

    public void setPlatformSharePercent(double platformSharePercent) {
        this.platformSharePercent = platformSharePercent;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
