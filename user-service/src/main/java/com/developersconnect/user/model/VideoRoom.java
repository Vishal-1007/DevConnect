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
@Table(name = "video_rooms")
public class VideoRoom {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID hostId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false, length = 32)
    private String category = "general";

    @Column(nullable = false)
    private int maxParticipants = 8;

    @Column(name = "room_code", length = 32)
    private String roomCode;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "is_premium_room", nullable = false)
    private boolean premiumRoom;

    @Column(name = "expiry_warning_sent", nullable = false)
    private boolean expiryWarningSent;

    @Column(nullable = false, length = 16)
    private String status = "live";

    @Column(nullable = false, length = 32)
    private String roomType = "public";

    @Column(nullable = false, length = 32)
    private String useCase = "community";

    @Column
    private UUID parentRoomId;

    @Column(nullable = false)
    private boolean chatEnabled = true;

    @Column(nullable = false)
    private boolean screenShareEnabled = true;

    @Column(nullable = false)
    private boolean breakoutEnabled = false;

    @Column(nullable = false)
    private boolean featured = false;

    @Column(nullable = false)
    private int featuredOrder = 0;

    @Column(nullable = false, length = 16)
    private String visibility = "public";

    @Column
    private UUID moderatorId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "video_room_tags", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "tag", length = 64)
    private Set<String> tags = new LinkedHashSet<>();

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant endedAt;

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

    public UUID getId() {
        return id;
    }

    public UUID getHostId() {
        return hostId;
    }

    public void setHostId(UUID hostId) {
        this.hostId = hostId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(int maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isPremiumRoom() {
        return premiumRoom;
    }

    public void setPremiumRoom(boolean premiumRoom) {
        this.premiumRoom = premiumRoom;
    }

    public boolean isExpiryWarningSent() {
        return expiryWarningSent;
    }

    public void setExpiryWarningSent(boolean expiryWarningSent) {
        this.expiryWarningSent = expiryWarningSent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getUseCase() {
        return useCase;
    }

    public void setUseCase(String useCase) {
        this.useCase = useCase;
    }

    public UUID getParentRoomId() {
        return parentRoomId;
    }

    public void setParentRoomId(UUID parentRoomId) {
        this.parentRoomId = parentRoomId;
    }

    public boolean isChatEnabled() {
        return chatEnabled;
    }

    public void setChatEnabled(boolean chatEnabled) {
        this.chatEnabled = chatEnabled;
    }

    public boolean isScreenShareEnabled() {
        return screenShareEnabled;
    }

    public void setScreenShareEnabled(boolean screenShareEnabled) {
        this.screenShareEnabled = screenShareEnabled;
    }

    public boolean isBreakoutEnabled() {
        return breakoutEnabled;
    }

    public void setBreakoutEnabled(boolean breakoutEnabled) {
        this.breakoutEnabled = breakoutEnabled;
    }

    public boolean isFeatured() {
        return featured;
    }

    public void setFeatured(boolean featured) {
        this.featured = featured;
    }

    public int getFeaturedOrder() {
        return featuredOrder;
    }

    public void setFeaturedOrder(int featuredOrder) {
        this.featuredOrder = featuredOrder;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public UUID getModeratorId() {
        return moderatorId;
    }

    public void setModeratorId(UUID moderatorId) {
        this.moderatorId = moderatorId;
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

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }
}
