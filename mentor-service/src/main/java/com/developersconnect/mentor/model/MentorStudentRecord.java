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
@Table(name = "mentor_student_records")
public class MentorStudentRecord {

    public static final String STATUS_ACTIVE = "ACTIVE";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false)
    private UUID learnerId;

    @Column(nullable = false, length = 64)
    private String learnerName;

    @Column(nullable = false, length = 32)
    private String category = "active_project";

    @Column(length = 64)
    private String weakArea;

    @Column(length = 64)
    private String strongArea;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private int interviewReadinessPct;

    @Column(length = 128)
    private String interviewTarget;

    @Column(nullable = false)
    private int baselineProgressPct;

    @Column(nullable = false, length = 16)
    private String status = "ACTIVE";

    @Column
    private Instant acceptedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public UUID getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(UUID learnerId) {
        this.learnerId = learnerId;
    }

    public String getLearnerName() {
        return learnerName;
    }

    public void setLearnerName(String learnerName) {
        this.learnerName = learnerName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getWeakArea() {
        return weakArea;
    }

    public void setWeakArea(String weakArea) {
        this.weakArea = weakArea;
    }

    public String getStrongArea() {
        return strongArea;
    }

    public void setStrongArea(String strongArea) {
        this.strongArea = strongArea;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public int getInterviewReadinessPct() {
        return interviewReadinessPct;
    }

    public void setInterviewReadinessPct(int interviewReadinessPct) {
        this.interviewReadinessPct = interviewReadinessPct;
    }

    public String getInterviewTarget() {
        return interviewTarget;
    }

    public void setInterviewTarget(String interviewTarget) {
        this.interviewTarget = interviewTarget;
    }

    public int getBaselineProgressPct() {
        return baselineProgressPct;
    }

    public void setBaselineProgressPct(int baselineProgressPct) {
        this.baselineProgressPct = baselineProgressPct;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
