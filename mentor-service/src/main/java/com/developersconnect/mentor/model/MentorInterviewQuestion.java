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
@Table(name = "mentor_interview_questions")
public class MentorInterviewQuestion {

    @Id
    @UuidGenerator
    private UUID id;

    @Column
    private UUID mentorId;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(nullable = false, length = 16)
    private String difficulty;

    @Column(nullable = false, length = 2000)
    private String questionText;

    @Column(columnDefinition = "CLOB")
    private String followUps;

    @Column(columnDefinition = "CLOB")
    private String evaluationHints;

    @Column(nullable = false)
    private boolean aiGenerated;

    @Column(nullable = false)
    private boolean template;

    @Column(length = 500)
    private String title;

    @Column(columnDefinition = "CLOB")
    private String description;

    @Column(name = "expected_answer", columnDefinition = "CLOB")
    private String expectedAnswer;

    @Column(length = 500)
    private String tags;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "reference_links", columnDefinition = "CLOB")
    private String referenceLinks;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (!template && !aiGenerated) {
            archived = false;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getFollowUps() { return followUps; }
    public void setFollowUps(String followUps) { this.followUps = followUps; }
    public String getEvaluationHints() { return evaluationHints; }
    public void setEvaluationHints(String evaluationHints) { this.evaluationHints = evaluationHints; }
    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }
    public boolean isTemplate() { return template; }
    public void setTemplate(boolean template) { this.template = template; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getExpectedAnswer() { return expectedAnswer; }
    public void setExpectedAnswer(String expectedAnswer) { this.expectedAnswer = expectedAnswer; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public Integer getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(Integer estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
    public String getReferenceLinks() { return referenceLinks; }
    public void setReferenceLinks(String referenceLinks) { this.referenceLinks = referenceLinks; }
    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
