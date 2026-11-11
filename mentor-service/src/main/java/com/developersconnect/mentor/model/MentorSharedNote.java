package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "mentor_shared_notes")
public class MentorSharedNote {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "CLOB")
    private String content;

    @Column(nullable = false, length = 32)
    private String materialType = "note";

    @Column(length = 500)
    private String tags;

    @Column(length = 255)
    private String fileName;

    @Column(length = 128)
    private String fileMimeType;

    @Column
    private Long fileSizeBytes;

    @Column(columnDefinition = "CLOB")
    private String fileDataBase64;

    @Column(length = 2000)
    private String sharedWithLearnerIds;

    @Column
    private UUID linkedBookingId;

    @Column(nullable = false)
    private boolean published;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMaterialType() { return materialType; }
    public void setMaterialType(String materialType) { this.materialType = materialType; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileMimeType() { return fileMimeType; }
    public void setFileMimeType(String fileMimeType) { this.fileMimeType = fileMimeType; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    public String getFileDataBase64() { return fileDataBase64; }
    public void setFileDataBase64(String fileDataBase64) { this.fileDataBase64 = fileDataBase64; }
    public String getSharedWithLearnerIds() { return sharedWithLearnerIds; }
    public void setSharedWithLearnerIds(String sharedWithLearnerIds) { this.sharedWithLearnerIds = sharedWithLearnerIds; }
    public UUID getLinkedBookingId() { return linkedBookingId; }
    public void setLinkedBookingId(UUID linkedBookingId) { this.linkedBookingId = linkedBookingId; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
