package com.developersconnect.user.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "community_post_comments")
public class CommunityPostComment {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID postId;

    @Column(nullable = false)
    private UUID authorId;

    @Column(nullable = false, length = 512)
    private String content;

    @Column(name = "parent_comment_id")
    private UUID parentCommentId;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public void setAuthorId(UUID authorId) {
        this.authorId = authorId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public UUID getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(UUID parentCommentId) {
        this.parentCommentId = parentCommentId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
