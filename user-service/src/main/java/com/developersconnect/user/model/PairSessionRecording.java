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
@Table(name = "pair_session_recordings")
public class PairSessionRecording {

    public static final String STATUS_RECORDING = "RECORDING";
    public static final String STATUS_STOPPED = "STOPPED";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Column(length = 512)
    private String videoUrl;

    @Column(nullable = false, length = 16)
    private String status = STATUS_RECORDING;

    @Column(nullable = false)
    private Instant startedAt;

    @Column
    private Instant stoppedAt;

    @PrePersist
    void onCreate() {
        if (startedAt == null) startedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getStoppedAt() { return stoppedAt; }
    public void setStoppedAt(Instant stoppedAt) { this.stoppedAt = stoppedAt; }
}
