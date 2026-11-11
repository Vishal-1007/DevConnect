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
@Table(name = "user_video_room_subscriptions")
public class UserVideoRoomSubscription {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "video_room_premium", nullable = false)
    private boolean videoRoomPremium;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "amount_cents")
    private Integer amountCents;

    @Column(name = "purchase_date")
    private Instant purchaseDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public boolean isVideoRoomPremium() { return videoRoomPremium; }
    public void setVideoRoomPremium(boolean videoRoomPremium) { this.videoRoomPremium = videoRoomPremium; }
    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public Integer getAmountCents() { return amountCents; }
    public void setAmountCents(Integer amountCents) { this.amountCents = amountCents; }
    public Instant getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(Instant purchaseDate) { this.purchaseDate = purchaseDate; }
}
