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
@Table(name = "stream_cart_items")
public class StreamCartItem {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @PrePersist
    void onCreate() {
        addedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }
    public Instant getAddedAt() { return addedAt; }
}
