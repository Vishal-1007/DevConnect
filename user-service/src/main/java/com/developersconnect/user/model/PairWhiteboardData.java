package com.developersconnect.user.model;

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
@Table(name = "pair_whiteboard_data")
public class PairWhiteboardData {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID sessionId;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String jsonData = "[]";

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getJsonData() { return jsonData; }
    public void setJsonData(String jsonData) { this.jsonData = jsonData; }
    public Instant getUpdatedAt() { return updatedAt; }
}
