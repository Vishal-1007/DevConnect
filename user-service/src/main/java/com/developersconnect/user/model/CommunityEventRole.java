package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "community_event_roles")
@IdClass(CommunityEventRole.EventRoleId.class)
public class CommunityEventRole {

    @Id
    @Column(name = "event_id")
    private UUID eventId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(nullable = false, length = 32)
    private String role;

    @Column(nullable = false, length = 32)
    private String status = "approved";

    @Column(nullable = false)
    private Instant appliedAt;

    @PrePersist
    void onCreate() {
        if (appliedAt == null) {
            appliedAt = Instant.now();
        }
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Instant appliedAt) {
        this.appliedAt = appliedAt;
    }

    public static class EventRoleId implements Serializable {
        private UUID eventId;
        private UUID userId;
        private String role;

        public EventRoleId() {
        }

        public EventRoleId(UUID eventId, UUID userId, String role) {
            this.eventId = eventId;
            this.userId = userId;
            this.role = role;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof EventRoleId that)) {
                return false;
            }
            return Objects.equals(eventId, that.eventId)
                && Objects.equals(userId, that.userId)
                && Objects.equals(role, that.role);
        }

        @Override
        public int hashCode() {
            return Objects.hash(eventId, userId, role);
        }
    }
}
