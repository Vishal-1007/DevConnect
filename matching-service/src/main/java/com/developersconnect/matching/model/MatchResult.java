package com.developersconnect.matching.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "match_results")
public class MatchResult {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID requestId;

    @Column(nullable = false)
    private UUID matchedUserId;

    @Column(nullable = false)
    private double score;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public void setRequestId(UUID requestId) {
        this.requestId = requestId;
    }

    public UUID getMatchedUserId() {
        return matchedUserId;
    }

    public void setMatchedUserId(UUID matchedUserId) {
        this.matchedUserId = matchedUserId;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
