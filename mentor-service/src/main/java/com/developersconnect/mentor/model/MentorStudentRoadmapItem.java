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
@Table(name = "mentor_student_roadmap_items")
public class MentorStudentRoadmapItem {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false)
    private UUID learnerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 64)
    private String milestone;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false, length = 32)
    private String status = "active";

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMilestone() {
        return milestone;
    }

    public void setMilestone(String milestone) {
        this.milestone = milestone;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
