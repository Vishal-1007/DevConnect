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
@Table(name = "tutorial_cart_items")
@IdClass(TutorialCartItem.CartId.class)
public class TutorialCartItem {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "tutorial_id", nullable = false)
    private UUID tutorialId;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @PrePersist
    void onCreate() {
        addedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getTutorialId() { return tutorialId; }
    public void setTutorialId(UUID tutorialId) { this.tutorialId = tutorialId; }
    public Instant getAddedAt() { return addedAt; }
    public void setAddedAt(Instant addedAt) { this.addedAt = addedAt; }

    public static class CartId implements Serializable {
        private UUID userId;
        private UUID tutorialId;

        public CartId() {}

        public CartId(UUID userId, UUID tutorialId) {
            this.userId = userId;
            this.tutorialId = tutorialId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof CartId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(tutorialId, that.tutorialId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, tutorialId);
        }
    }
}
