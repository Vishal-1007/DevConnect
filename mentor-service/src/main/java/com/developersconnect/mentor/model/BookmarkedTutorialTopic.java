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
@Table(name = "bookmarked_tutorial_topics")
@IdClass(BookmarkedTutorialTopic.BookmarkId.class)
public class BookmarkedTutorialTopic {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "topic_id", nullable = false)
    private UUID topicId;

    @Column(name = "tutorial_id", nullable = false)
    private UUID tutorialId;

    @Column(name = "bookmarked_at", nullable = false)
    private Instant bookmarkedAt;

    @PrePersist
    void onCreate() {
        bookmarkedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }
    public UUID getTutorialId() { return tutorialId; }
    public void setTutorialId(UUID tutorialId) { this.tutorialId = tutorialId; }
    public Instant getBookmarkedAt() { return bookmarkedAt; }
    public void setBookmarkedAt(Instant bookmarkedAt) { this.bookmarkedAt = bookmarkedAt; }

    public static class BookmarkId implements Serializable {
        private UUID userId;
        private UUID topicId;

        public BookmarkId() {}

        public BookmarkId(UUID userId, UUID topicId) {
            this.userId = userId;
            this.topicId = topicId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof BookmarkId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(topicId, that.topicId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, topicId);
        }
    }
}
