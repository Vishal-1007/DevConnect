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
@Table(name = "mentor_reviews")
public class MentorReview {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID mentorId;

    private UUID learnerId;

    @Column(nullable = false, length = 64)
    private String learnerName;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 2000)
    private String reviewText;

    @Column(length = 64)
    private String topic;

    @Column(length = 1000)
    private String improvementSuggestion;

    @Column(columnDefinition = "TEXT")
    private String mentorReply;

    @Column(nullable = false)
    private boolean showcased;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant repliedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public String getLearnerName() { return learnerName; }
    public void setLearnerName(String learnerName) { this.learnerName = learnerName; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getImprovementSuggestion() { return improvementSuggestion; }
    public void setImprovementSuggestion(String improvementSuggestion) { this.improvementSuggestion = improvementSuggestion; }
    public String getMentorReply() { return mentorReply; }
    public void setMentorReply(String mentorReply) { this.mentorReply = mentorReply; }
    public boolean isShowcased() { return showcased; }
    public void setShowcased(boolean showcased) { this.showcased = showcased; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getRepliedAt() { return repliedAt; }
    public void setRepliedAt(Instant repliedAt) { this.repliedAt = repliedAt; }
}
