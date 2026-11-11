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
@Table(name = "user_ratings")
public class UserRating {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID ratedUserId;

    @Column(nullable = false)
    private UUID raterUserId;

    @Column(nullable = false)
    private int score;

    @Column(length = 512)
    private String comment;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRatedUserId() {
        return ratedUserId;
    }

    public void setRatedUserId(UUID ratedUserId) {
        this.ratedUserId = ratedUserId;
    }

    public UUID getRaterUserId() {
        return raterUserId;
    }

    public void setRaterUserId(UUID raterUserId) {
        this.raterUserId = raterUserId;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
