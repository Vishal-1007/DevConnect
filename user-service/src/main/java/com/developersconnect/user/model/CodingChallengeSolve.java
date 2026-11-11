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
@Table(name = "coding_challenge_solves")
public class CodingChallengeSolve {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID challengeId;

    @Column(nullable = false, length = 32)
    private String language;

    @Column(nullable = false)
    private Instant solvedAt;

    @PrePersist
    void onCreate() {
        if (solvedAt == null) solvedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getChallengeId() { return challengeId; }
    public void setChallengeId(UUID challengeId) { this.challengeId = challengeId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Instant getSolvedAt() { return solvedAt; }
    public void setSolvedAt(Instant solvedAt) { this.solvedAt = solvedAt; }
}
