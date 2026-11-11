package com.developersconnect.mentor.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "learning_lessons")
public class LearningLesson {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "section_id", nullable = false)
    private UUID sectionId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "video_url", length = 512)
    private String videoUrl;

    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;

    @Column(columnDefinition = "CLOB")
    private String description;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "preview_free", nullable = false)
    private boolean previewFree;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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
    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }
    public UUID getSectionId() { return sectionId; }
    public void setSectionId(UUID sectionId) { this.sectionId = sectionId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public boolean isPreviewFree() { return previewFree; }
    public void setPreviewFree(boolean previewFree) { this.previewFree = previewFree; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
