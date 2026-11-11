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
@Table(name = "mentor_followers")
public class MentorFollower {

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
    public Instant getCreatedAt() { return createdAt; }

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "mentor_id", nullable = false)
        private UUID mentorId;
        @Column(name = "learner_id", nullable = false)
        private UUID learnerId;

        public Id() {}
        public Id(UUID mentorId, UUID learnerId) {
            this.mentorId = mentorId;
            this.learnerId = learnerId;
        }
        public UUID getMentorId() { return mentorId; }
        public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
        public UUID getLearnerId() { return learnerId; }
        public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(mentorId, other.mentorId) && Objects.equals(learnerId, other.learnerId);
        }
        @Override public int hashCode() { return Objects.hash(mentorId, learnerId); }
    }
}
