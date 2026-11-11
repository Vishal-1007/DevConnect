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
@Table(name = "watch_progress")
public class WatchProgress {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Column(name = "progress_seconds", nullable = false)
    private int progressSeconds;

    @Column(name = "watched_duration_seconds", nullable = false)
    private int watchedDurationSeconds;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }
    public UUID getLessonId() { return lessonId; }
    public void setLessonId(UUID lessonId) { this.lessonId = lessonId; }
    public int getProgressSeconds() { return progressSeconds; }
    public void setProgressSeconds(int progressSeconds) { this.progressSeconds = progressSeconds; }
    public int getWatchedDurationSeconds() { return watchedDurationSeconds; }
    public void setWatchedDurationSeconds(int watchedDurationSeconds) { this.watchedDurationSeconds = watchedDurationSeconds; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Instant getUpdatedAt() { return updatedAt; }
}
