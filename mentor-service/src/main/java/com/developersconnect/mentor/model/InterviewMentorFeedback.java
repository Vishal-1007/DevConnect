package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "interview_mentor_feedback")
public class InterviewMentorFeedback {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "mentor_id", nullable = false)
    private UUID mentorId;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(name = "overall_score", precision = 4, scale = 2)
    private BigDecimal overallScore;

    @Column(columnDefinition = "CLOB")
    private String strengths;

    @Column(columnDefinition = "CLOB")
    private String improvements;

    @Column(columnDefinition = "CLOB")
    private String recommendations;

    @Column(columnDefinition = "CLOB")
    private String comments;

    @Column(name = "reviewed_at", nullable = false)
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (reviewedAt == null) {
            reviewedAt = now;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public BigDecimal getOverallScore() { return overallScore; }
    public void setOverallScore(BigDecimal overallScore) { this.overallScore = overallScore; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getImprovements() { return improvements; }
    public void setImprovements(String improvements) { this.improvements = improvements; }
    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void markReviewed(Instant reviewedAt) {
        this.reviewedAt = reviewedAt != null ? reviewedAt : Instant.now();
    }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
