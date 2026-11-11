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
@Table(name = "practice_attempts")
public class PracticeAttempt {

    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String MODE_SOLO = "SOLO";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private UUID problemId;

    @Column(columnDefinition = "CLOB")
    private String code;

    @Column(nullable = false, length = 32)
    private String language;

    @Column(nullable = false, length = 16)
    private String status = STATUS_IN_PROGRESS;

    @Column(nullable = false, length = 16)
    private String mode = MODE_SOLO;

    @Column(nullable = false)
    private Instant startedAt;

    @Column
    private Instant completedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (startedAt == null) startedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public UUID getProblemId() { return problemId; }
    public void setProblemId(UUID problemId) { this.problemId = problemId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
