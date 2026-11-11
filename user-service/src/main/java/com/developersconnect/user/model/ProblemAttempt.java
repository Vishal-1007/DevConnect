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
@Table(name = "problem_attempts")
public class ProblemAttempt {

    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_PASSED = "PASSED";
    public static final String STATUS_FAILED = "FAILED";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private UUID problemId;

    @Column(columnDefinition = "CLOB")
    private String code;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(nullable = false, length = 32)
    private String language;

    @Column(nullable = false)
    private Instant submittedAt;

    @PrePersist
    void onCreate() {
        if (submittedAt == null) submittedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public UUID getProblemId() { return problemId; }
    public void setProblemId(UUID problemId) { this.problemId = problemId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}
