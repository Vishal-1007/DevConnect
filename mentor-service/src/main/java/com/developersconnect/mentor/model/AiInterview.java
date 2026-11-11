package com.developersconnect.mentor.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_interviews")
public class AiInterview {

    public enum Status {
        SETUP, IN_PROGRESS, COMPLETED
    }

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "resume_url", length = 512)
    private String resumeUrl;

    @Column(name = "candidate_name", length = 128)
    private String candidateName;

    @Column(name = "target_role", length = 128)
    private String targetRole;

    @Column(name = "experience_level", length = 32)
    private String experienceLevel;

    @Column(name = "interview_type", length = 32)
    private String interviewType;

    @Column(name = "resume_data", columnDefinition = "TEXT")
    private String resumeData;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.SETUP;

    @Column
    private Integer score;

    @Column(name = "technical_score")
    private Integer technicalScore;

    @Column(name = "communication_score")
    private Integer communicationScore;

    @Column(name = "problem_solving_score")
    private Integer problemSolvingScore;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(length = 2000)
    private String strengths;

    @Column(length = 2000)
    private String improvements;

    @Column(name = "recommended_topics", length = 1000)
    private String recommendedTopics;

    @Column(name = "intro_message", length = 2000)
    private String introMessage;

    @Column(name = "question_count")
    private Integer questionCount = 0;

    @Column(name = "difficulty_level")
    private Integer difficultyLevel = 1;

    @Column(name = "grammar_score")
    private Integer grammarScore;

    @Column(name = "current_score")
    private Integer currentScore;

    @Column(name = "context_json", columnDefinition = "TEXT")
    private String contextJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getResumeUrl() { return resumeUrl; }
    public void setResumeUrl(String resumeUrl) { this.resumeUrl = resumeUrl; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
    public String getInterviewType() { return interviewType; }
    public void setInterviewType(String interviewType) { this.interviewType = interviewType; }
    public String getResumeData() { return resumeData; }
    public void setResumeData(String resumeData) { this.resumeData = resumeData; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Integer technicalScore) { this.technicalScore = technicalScore; }
    public Integer getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(Integer communicationScore) { this.communicationScore = communicationScore; }
    public Integer getProblemSolvingScore() { return problemSolvingScore; }
    public void setProblemSolvingScore(Integer problemSolvingScore) { this.problemSolvingScore = problemSolvingScore; }
    public Integer getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getImprovements() { return improvements; }
    public void setImprovements(String improvements) { this.improvements = improvements; }
    public String getRecommendedTopics() { return recommendedTopics; }
    public void setRecommendedTopics(String recommendedTopics) { this.recommendedTopics = recommendedTopics; }
    public String getIntroMessage() { return introMessage; }
    public void setIntroMessage(String introMessage) { this.introMessage = introMessage; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public Integer getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(Integer difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public Integer getGrammarScore() { return grammarScore; }
    public void setGrammarScore(Integer grammarScore) { this.grammarScore = grammarScore; }
    public Integer getCurrentScore() { return currentScore; }
    public void setCurrentScore(Integer currentScore) { this.currentScore = currentScore; }
    public String getContextJson() { return contextJson; }
    public void setContextJson(String contextJson) { this.contextJson = contextJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
