package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "mock_interview_favorites")
public class MockInterviewFavorite {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID learnerId;

    @Column(nullable = false)
    private UUID interviewerUserId;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getInterviewerUserId() { return interviewerUserId; }
    public void setInterviewerUserId(UUID interviewerUserId) { this.interviewerUserId = interviewerUserId; }
    public Instant getCreatedAt() { return createdAt; }
}
