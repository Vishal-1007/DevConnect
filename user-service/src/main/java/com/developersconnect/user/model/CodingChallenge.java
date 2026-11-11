package com.developersconnect.user.model;

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
@Table(name = "coding_challenges")
public class CodingChallenge {

    public static final String CREATOR_SYSTEM = "SYSTEM";
    public static final String CREATOR_ADMIN = "ADMIN";
    public static final String CREATOR_MENTOR = "MENTOR";

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String description;

    @Column(nullable = false, length = 16)
    private String difficulty;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String languagesJson;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String tagsJson;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String companiesJson;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String starterCodeJson;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String testCasesJson;

    @Column(columnDefinition = "CLOB")
    private String solution;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String hintsJson = "[]";

    @Column(nullable = false, columnDefinition = "CLOB")
    private String constraintsJson = "[]";

    @Column(nullable = false, columnDefinition = "CLOB")
    private String examplesJson = "[]";

    @Column(nullable = false, length = 20)
    private String status = STATUS_PUBLISHED;

    @Column
    private UUID createdBy;

    @Column(nullable = false, length = 16)
    private String creatorType;

    @Column(nullable = false)
    private boolean published;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (creatorType == null) creatorType = CREATOR_SYSTEM;
        if (status == null) status = published ? STATUS_PUBLISHED : STATUS_DRAFT;
        if (hintsJson == null) hintsJson = "[]";
        if (constraintsJson == null) constraintsJson = "[]";
        if (examplesJson == null) examplesJson = "[]";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLanguagesJson() { return languagesJson; }
    public void setLanguagesJson(String languagesJson) { this.languagesJson = languagesJson; }
    public String getTagsJson() { return tagsJson; }
    public void setTagsJson(String tagsJson) { this.tagsJson = tagsJson; }
    public String getCompaniesJson() { return companiesJson; }
    public void setCompaniesJson(String companiesJson) { this.companiesJson = companiesJson; }
    public String getStarterCodeJson() { return starterCodeJson; }
    public void setStarterCodeJson(String starterCodeJson) { this.starterCodeJson = starterCodeJson; }
    public String getTestCasesJson() { return testCasesJson; }
    public void setTestCasesJson(String testCasesJson) { this.testCasesJson = testCasesJson; }
    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
    public String getHintsJson() { return hintsJson; }
    public void setHintsJson(String hintsJson) { this.hintsJson = hintsJson; }
    public String getConstraintsJson() { return constraintsJson; }
    public void setConstraintsJson(String constraintsJson) { this.constraintsJson = constraintsJson; }
    public String getExamplesJson() { return examplesJson; }
    public void setExamplesJson(String examplesJson) { this.examplesJson = examplesJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) {
        this.status = status;
        this.published = STATUS_PUBLISHED.equals(status);
    }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public String getCreatorType() { return creatorType; }
    public void setCreatorType(String creatorType) { this.creatorType = creatorType; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) {
        this.published = published;
        if (published && (status == null || STATUS_DRAFT.equals(status))) {
            this.status = STATUS_PUBLISHED;
        } else if (!published && STATUS_PUBLISHED.equals(status)) {
            this.status = STATUS_DRAFT;
        }
    }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
