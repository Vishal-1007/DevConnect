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
@Table(name = "interview_pack_reviews")
public class InterviewPackReview {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "question_set_id", nullable = false)
    private UUID questionSetId;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(nullable = false)
    private int rating;

    @Column(name = "review_text", length = 2000)
    private String reviewText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getQuestionSetId() { return questionSetId; }
    public void setQuestionSetId(UUID questionSetId) { this.questionSetId = questionSetId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
