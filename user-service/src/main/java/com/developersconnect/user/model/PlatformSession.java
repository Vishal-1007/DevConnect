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
@Table(name = "platform_sessions")
public class PlatformSession {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, length = 32)
    private String sessionType = "video_call";

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private UUID hostId;

    @Column(nullable = false, length = 16)
    private String status = "live";

    @Column(nullable = false)
    private int participantCount;

    @Column(nullable = false)
    private int maxParticipants = 8;

    @Column(nullable = false)
    private int qualityScore = 85;

    @Column(nullable = false)
    private long durationSeconds;

    @Column(length = 512)
    private String recordingUrl;

    @Column(nullable = false)
    private boolean recordingAvailable;

    @Column(nullable = false)
    private boolean aiModerationEnabled = true;

    @Column(nullable = false, length = 32)
    private String moderationStatus = "clear";

    @Column(nullable = false)
    private int reportCount;

    @Column
    private UUID linkedRoomId;

    @Column
    private UUID linkedMatchRequestId;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant endedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (startedAt == null) {
            startedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getSessionType() {
        return sessionType;
    }

    public void setSessionType(String sessionType) {
        this.sessionType = sessionType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getHostId() {
        return hostId;
    }

    public void setHostId(UUID hostId) {
        this.hostId = hostId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getParticipantCount() {
        return participantCount;
    }

    public void setParticipantCount(int participantCount) {
        this.participantCount = participantCount;
    }

    public int getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(int maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public int getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(int qualityScore) {
        this.qualityScore = qualityScore;
    }

    public long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public String getRecordingUrl() {
        return recordingUrl;
    }

    public void setRecordingUrl(String recordingUrl) {
        this.recordingUrl = recordingUrl;
    }

    public boolean isRecordingAvailable() {
        return recordingAvailable;
    }

    public void setRecordingAvailable(boolean recordingAvailable) {
        this.recordingAvailable = recordingAvailable;
    }

    public boolean isAiModerationEnabled() {
        return aiModerationEnabled;
    }

    public void setAiModerationEnabled(boolean aiModerationEnabled) {
        this.aiModerationEnabled = aiModerationEnabled;
    }

    public String getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(String moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public int getReportCount() {
        return reportCount;
    }

    public void setReportCount(int reportCount) {
        this.reportCount = reportCount;
    }

    public UUID getLinkedRoomId() {
        return linkedRoomId;
    }

    public void setLinkedRoomId(UUID linkedRoomId) {
        this.linkedRoomId = linkedRoomId;
    }

    public UUID getLinkedMatchRequestId() {
        return linkedMatchRequestId;
    }

    public void setLinkedMatchRequestId(UUID linkedMatchRequestId) {
        this.linkedMatchRequestId = linkedMatchRequestId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
