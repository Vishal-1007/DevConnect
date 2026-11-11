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
@Table(name = "mock_interview_feedback")
public class MockInterviewFeedback {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID sessionId;

    @Column(nullable = false)
    private UUID learnerId;

    @Column(nullable = false)
    private UUID interviewerId;

    @Column(nullable = false)
    private int technicalScore;

    @Column(nullable = false)
    private int communicationScore;

    @Column(nullable = false)
    private int problemSolvingScore;

    @Column(nullable = false)
    private int systemDesignScore;

    @Column(length = 2000)
    private String strengths;

    @Column(length = 2000)
    private String weaknesses;

    @Column(length = 2000)
    private String recommendations;

    @Column(nullable = false)
    private double overallRating;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getInterviewerId() { return interviewerId; }
    public void setInterviewerId(UUID interviewerId) { this.interviewerId = interviewerId; }
    public int getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(int technicalScore) { this.technicalScore = technicalScore; }
    public int getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(int communicationScore) { this.communicationScore = communicationScore; }
    public int getProblemSolvingScore() { return problemSolvingScore; }
    public void setProblemSolvingScore(int problemSolvingScore) { this.problemSolvingScore = problemSolvingScore; }
    public int getSystemDesignScore() { return systemDesignScore; }
    public void setSystemDesignScore(int systemDesignScore) { this.systemDesignScore = systemDesignScore; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getWeaknesses() { return weaknesses; }
    public void setWeaknesses(String weaknesses) { this.weaknesses = weaknesses; }
    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }
    public double getOverallRating() { return overallRating; }
    public void setOverallRating(double overallRating) { this.overallRating = overallRating; }
    public Instant getCreatedAt() { return createdAt; }
}
