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
@Table(name = "video_room_payment_transactions")
public class VideoRoomPaymentTransaction {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "payment_id", nullable = false, unique = true)
    private UUID paymentId;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(name = "feature_type", nullable = false, length = 32)
    private String featureType;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public int getAmountCents() { return amountCents; }
    public void setAmountCents(int amountCents) { this.amountCents = amountCents; }
    public String getFeatureType() { return featureType; }
    public void setFeatureType(String featureType) { this.featureType = featureType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
