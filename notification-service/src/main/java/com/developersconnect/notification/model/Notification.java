package com.developersconnect.notification.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 64)
    private String type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 2000)
    private String body;

    /** Links to platform_notifications when delivered from a campaign or broadcast. */
    @Column
    private UUID platformNotificationId;

    @Column
    private Instant readAt;

    @Column
    private Instant deletedAt;

    @Column(nullable = false)
    private Instant deliveredAt;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.deliveredAt == null) {
            this.deliveredAt = now;
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public UUID getPlatformNotificationId() {
        return platformNotificationId;
    }

    public void setPlatformNotificationId(UUID platformNotificationId) {
        this.platformNotificationId = platformNotificationId;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isRead() {
        return readAt != null;
    }
}
