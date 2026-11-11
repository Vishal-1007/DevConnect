package com.developersconnect.matching.model;

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
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "user_match_index")
public class UserMatchIndex {

    @Id
    private UUID userId;

    @Column(length = 32)
    private String experienceLevel;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_match_index_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill", length = 64)
    private Set<String> skills = new LinkedHashSet<>();

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public void setSkills(Set<String> skills) {
        this.skills = skills;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
