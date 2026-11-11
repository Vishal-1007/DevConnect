package com.developersconnect.mentor.model;

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
@Table(name = "mock_interview_sessions")
public class MockInterviewSession {

    public static final String STATUS_WAITING = "WAITING";
    public static final String STATUS_LIVE = "LIVE";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID requestId;

    @Column(nullable = false, unique = true, length = 12)
    private String sessionCode;

    @Column(nullable = false)
    private UUID roomId;

    @Column(nullable = false, length = 16)
    private String status = STATUS_WAITING;

    @Column
    private Instant startedAt;

    @Column
    private Instant endedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (roomId == null) roomId = UUID.randomUUID();
        if (sessionCode == null || sessionCode.isBlank()) {
            sessionCode = generateCode();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String generateCode() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "MI-" + suffix;
    }

    public UUID getId() { return id; }
    public UUID getRequestId() { return requestId; }
    public void setRequestId(UUID requestId) { this.requestId = requestId; }
    public String getSessionCode() { return sessionCode; }
    public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }
    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
