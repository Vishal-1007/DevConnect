package com.developersconnect.user.model;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "community_posts")
public class CommunityPost {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID authorId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 32)
    private String category = "general";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "community_post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag", length = 64)
    private Set<String> tags = new LinkedHashSet<>();

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private boolean removed;

    @Column(nullable = false)
    private boolean flagged;

    @Column(nullable = false)
    private boolean autoFlagged;

    @Column(nullable = false, length = 32)
    private String moderationStatus = "clear";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "community_post_moderation_flags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "flag", length = 32)
    private Set<String> moderationFlags = new LinkedHashSet<>();

    @Column(length = 500)
    private String moderationNote;

    @Column(name = "flagged_at")
    private Instant flaggedAt;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "image_file_id")
    private UUID imageFileId;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "attachment_url", length = 512)
    private String attachmentUrl;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "attachment_type", length = 128)
    private String attachmentType;

    @Column(name = "attachment_file_id")
    private UUID attachmentFileId;

    @Column(name = "code_content", columnDefinition = "TEXT")
    private String codeContent;

    @Column(name = "code_language", length = 32)
    private String codeLanguage;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public boolean isRemoved() {
        return removed;
    }

    public void setRemoved(boolean removed) {
        this.removed = removed;
    }

    public boolean isFlagged() {
        return flagged;
    }

    public void setFlagged(boolean flagged) {
        this.flagged = flagged;
    }

    public boolean isAutoFlagged() {
        return autoFlagged;
    }

    public void setAutoFlagged(boolean autoFlagged) {
        this.autoFlagged = autoFlagged;
    }

    public String getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(String moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public Set<String> getModerationFlags() {
        return moderationFlags;
    }

    public void setModerationFlags(Set<String> moderationFlags) {
        this.moderationFlags = moderationFlags;
    }

    public String getModerationNote() {
        return moderationNote;
    }

    public void setModerationNote(String moderationNote) {
        this.moderationNote = moderationNote;
    }

    public Instant getFlaggedAt() {
        return flaggedAt;
    }

    public void setFlaggedAt(Instant flaggedAt) {
        this.flaggedAt = flaggedAt;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public UUID getImageFileId() {
        return imageFileId;
    }

    public void setImageFileId(UUID imageFileId) {
        this.imageFileId = imageFileId;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public Long getAttachmentSize() {
        return attachmentSize;
    }

    public void setAttachmentSize(Long attachmentSize) {
        this.attachmentSize = attachmentSize;
    }

    public String getAttachmentType() {
        return attachmentType;
    }

    public void setAttachmentType(String attachmentType) {
        this.attachmentType = attachmentType;
    }

    public UUID getAttachmentFileId() {
        return attachmentFileId;
    }

    public void setAttachmentFileId(UUID attachmentFileId) {
        this.attachmentFileId = attachmentFileId;
    }

    public String getCodeContent() {
        return codeContent;
    }

    public void setCodeContent(String codeContent) {
        this.codeContent = codeContent;
    }

    public String getCodeLanguage() {
        return codeLanguage;
    }

    public void setCodeLanguage(String codeLanguage) {
        this.codeLanguage = codeLanguage;
    }
}
