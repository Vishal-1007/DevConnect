package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "pair_code_snapshots")
public class PairCodeSnapshot {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String content;

    @Column(nullable = false, length = 32)
    private String language;

    @Column
    private UUID savedBy;

    @Column(nullable = false)
    private Instant savedAt;

    @PrePersist
    void onCreate() {
        if (savedAt == null) savedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public UUID getSavedBy() { return savedBy; }
    public void setSavedBy(UUID savedBy) { this.savedBy = savedBy; }
    public Instant getSavedAt() { return savedAt; }
}
