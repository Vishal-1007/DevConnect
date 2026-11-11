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
@Table(name = "saved_learning_resources")
public class SavedLearningResource {

    @EmbeddedId
    private Id id;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt;

    @PrePersist
    void onCreate() {
        savedAt = Instant.now();
    }

    public Id getId() { return id; }
    public void setId(Id id) { this.id = id; }

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "learner_id")
        private UUID learnerId;
        @Column(name = "resource_id")
        private UUID resourceId;

        public Id() {}

        public Id(UUID learnerId, UUID resourceId) {
            this.learnerId = learnerId;
            this.resourceId = resourceId;
        }

        public UUID getLearnerId() { return learnerId; }
        public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
        public UUID getResourceId() { return resourceId; }
        public void setResourceId(UUID resourceId) { this.resourceId = resourceId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(learnerId, other.learnerId) && Objects.equals(resourceId, other.resourceId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(learnerId, resourceId);
        }
    }
}
