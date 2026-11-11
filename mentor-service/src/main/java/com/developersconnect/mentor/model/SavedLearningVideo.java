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
@Table(name = "saved_learning_videos")
public class SavedLearningVideo {

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
        @Column(name = "video_id")
        private UUID videoId;

        public Id() {}

        public Id(UUID learnerId, UUID videoId) {
            this.learnerId = learnerId;
            this.videoId = videoId;
        }

        public UUID getLearnerId() { return learnerId; }
        public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
        public UUID getVideoId() { return videoId; }
        public void setVideoId(UUID videoId) { this.videoId = videoId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(learnerId, other.learnerId) && Objects.equals(videoId, other.videoId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(learnerId, videoId);
        }
    }
}
