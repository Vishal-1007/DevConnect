package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "saved_courses")
public class SavedCourse {

    @EmbeddedId
    private Id id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Id getId() { return id; }
    public void setId(Id id) { this.id = id; }

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "learner_id")
        private UUID learnerId;
        @Column(name = "course_id")
        private UUID courseId;

        public Id() {}
        public Id(UUID learnerId, UUID courseId) {
            this.learnerId = learnerId;
            this.courseId = courseId;
        }
        public UUID getLearnerId() { return learnerId; }
        public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
        public UUID getCourseId() { return courseId; }
        public void setCourseId(UUID courseId) { this.courseId = courseId; }
        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(learnerId, other.learnerId) && Objects.equals(courseId, other.courseId);
        }
        @Override public int hashCode() { return Objects.hash(learnerId, courseId); }
    }
}
