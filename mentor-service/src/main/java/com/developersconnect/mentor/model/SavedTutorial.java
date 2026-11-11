package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "saved_tutorials")
@IdClass(SavedTutorial.SavedTutorialId.class)
public class SavedTutorial {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "tutorial_id", nullable = false)
    private UUID tutorialId;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt;

    @PrePersist
    void onCreate() {
        savedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getTutorialId() { return tutorialId; }
    public void setTutorialId(UUID tutorialId) { this.tutorialId = tutorialId; }
    public Instant getSavedAt() { return savedAt; }
    public void setSavedAt(Instant savedAt) { this.savedAt = savedAt; }

    public static class SavedTutorialId implements Serializable {
        private UUID userId;
        private UUID tutorialId;

        public SavedTutorialId() {}

        public SavedTutorialId(UUID userId, UUID tutorialId) {
            this.userId = userId;
            this.tutorialId = tutorialId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SavedTutorialId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(tutorialId, that.tutorialId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, tutorialId);
        }
    }
}
