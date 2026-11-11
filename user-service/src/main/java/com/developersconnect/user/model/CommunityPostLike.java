package com.developersconnect.user.model;

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
@Table(name = "community_post_likes")
@IdClass(CommunityPostLike.PostLikeId.class)
public class CommunityPostLike {

    @Id
    private UUID postId;

    @Id
    private UUID userId;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public static class PostLikeId implements Serializable {
        private UUID postId;
        private UUID userId;

        public PostLikeId() {
        }

        public PostLikeId(UUID postId, UUID userId) {
            this.postId = postId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof PostLikeId that)) {
                return false;
            }
            return Objects.equals(postId, that.postId) && Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(postId, userId);
        }
    }
}
