package com.developersconnect.user.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "video_room_participants")
@IdClass(VideoRoomParticipant.ParticipantId.class)
public class VideoRoomParticipant {

    @Id
    private UUID roomId;

    @Id
    private UUID userId;

    @Column(nullable = false)
    private Instant joinedAt;

    @Column(nullable = false)
    private boolean muted = false;

    @Column(nullable = false)
    private boolean canSpeak = true;

    @Column(nullable = false)
    private boolean handRaised = false;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(name = "participant_role", nullable = false)
    private String participantRole = VideoRoomParticipantRole.PARTICIPANT;

    @Column(nullable = false)
    private String status = VideoRoomParticipantStatus.ACTIVE;

    @Column(name = "camera_enabled", nullable = false)
    private boolean cameraEnabled = true;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public boolean isMuted() {
        return muted;
    }

    public void setMuted(boolean muted) {
        this.muted = muted;
    }

    public boolean isCanSpeak() {
        return canSpeak;
    }

    public void setCanSpeak(boolean canSpeak) {
        this.canSpeak = canSpeak;
    }

    public boolean isHandRaised() {
        return handRaised;
    }

    public void setHandRaised(boolean handRaised) {
        this.handRaised = handRaised;
    }

    public Instant getLeftAt() {
        return leftAt;
    }

    public void setLeftAt(Instant leftAt) {
        this.leftAt = leftAt;
    }

    public String getParticipantRole() {
        return participantRole;
    }

    public void setParticipantRole(String participantRole) {
        this.participantRole = participantRole;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isCameraEnabled() {
        return cameraEnabled;
    }

    public void setCameraEnabled(boolean cameraEnabled) {
        this.cameraEnabled = cameraEnabled;
    }

    public static class ParticipantId implements Serializable {
        private UUID roomId;
        private UUID userId;

        public ParticipantId() {
        }

        public ParticipantId(UUID roomId, UUID userId) {
            this.roomId = roomId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof ParticipantId that)) {
                return false;
            }
            return Objects.equals(roomId, that.roomId) && Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roomId, userId);
        }
    }
}
