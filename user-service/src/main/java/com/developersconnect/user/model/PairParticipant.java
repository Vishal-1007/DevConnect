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
@Table(name = "pair_participants")
public class PairParticipant {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private UUID userId;

    @Column(length = 128)
    private String displayName;

    @Column(nullable = false, length = 16)
    private String role;

    @Column(nullable = false)
    private boolean micEnabled = true;

    @Column(nullable = false)
    private boolean cameraEnabled = true;

    @Column(nullable = false)
    private Instant joinedAt;

    @Column
    private Instant leftAt;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isMicEnabled() { return micEnabled; }
    public void setMicEnabled(boolean micEnabled) { this.micEnabled = micEnabled; }
    public boolean isCameraEnabled() { return cameraEnabled; }
    public void setCameraEnabled(boolean cameraEnabled) { this.cameraEnabled = cameraEnabled; }
    public Instant getJoinedAt() { return joinedAt; }
    public Instant getLeftAt() { return leftAt; }
    public void setLeftAt(Instant leftAt) { this.leftAt = leftAt; }
}
