package com.developersconnect.user.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pair_programming_sessions")
public class PairProgrammingSession {

    public static final String STATUS_WAITING = "WAITING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    /** @deprecated use {@link #STATUS_ACTIVE} */
    @Deprecated
    public static final String STATUS_LIVE = STATUS_ACTIVE;
    /** @deprecated use {@link #STATUS_COMPLETED} */
    @Deprecated
    public static final String STATUS_ENDED = STATUS_COMPLETED;

    public static final String MODE_PAIR = "PAIR";
    public static final String MODE_SOLO = "SOLO";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 12)
    private String sessionCode;

    @Column(nullable = false)
    private UUID hostId;

    @Column(nullable = false)
    private UUID creatorId;

    @Column
    private UUID studentId;

    @Column
    private UUID mentorId;

    @Column
    private UUID assignmentId;

    @Column(nullable = false, length = 64)
    private String problemId;

    @Column(nullable = false, length = 200)
    private String problemTitle;

    @Column(nullable = false, length = 2000)
    private String problemDescription;

    @Column(nullable = false, length = 32)
    private String language;

    @Column(nullable = false, length = 16)
    private String difficulty;

    @Column(nullable = false, length = 16)
    private String status = STATUS_WAITING;

    @Column(columnDefinition = "CLOB")
    private String currentCode;

    @Column(nullable = false, length = 16)
    private String hostRole = "driver";

    @Column(nullable = false)
    private boolean allowMentorEdit = false;

    @Column(nullable = false, length = 16)
    private String mode = MODE_PAIR;

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
        if (creatorId == null) {
            creatorId = hostId;
        }
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
        return "PP-" + suffix;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSessionCode() { return sessionCode; }
    public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }
    public UUID getHostId() { return hostId; }
    public void setHostId(UUID hostId) { this.hostId = hostId; }
    public UUID getCreatorId() { return creatorId; }
    public void setCreatorId(UUID creatorId) { this.creatorId = creatorId; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    public String getProblemDescription() { return problemDescription; }
    public void setProblemDescription(String problemDescription) { this.problemDescription = problemDescription; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCurrentCode() { return currentCode; }
    public void setCurrentCode(String currentCode) { this.currentCode = currentCode; }
    public String getHostRole() { return hostRole; }
    public void setHostRole(String hostRole) { this.hostRole = hostRole; }
    public boolean isAllowMentorEdit() { return allowMentorEdit; }
    public void setAllowMentorEdit(boolean allowMentorEdit) { this.allowMentorEdit = allowMentorEdit; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
