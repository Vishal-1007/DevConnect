package com.developersconnect.user.model;

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
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "community_events")
public class CommunityEvent {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID hostId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, length = 32)
    private String eventType = "webinar";

    @Column(nullable = false, length = 32)
    private String category = "general";

    @Column(nullable = false, length = 16)
    private String format = "online";

    @Column(length = 512)
    private String locationOrLink;

    @Column(nullable = false)
    private Instant startsAt;

    @Column(nullable = false)
    private Instant endsAt;

    @Column(nullable = false)
    private int maxAttendees = 100;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "community_event_tags", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "tag", length = 64)
    private Set<String> tags = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "community_event_speakers", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "speaker_id")
    private Set<UUID> speakerIds = new LinkedHashSet<>();

    @Column(nullable = false)
    private boolean cancelled = false;

    @Column(name = "webinar_subtype", length = 32)
    private String webinarSubtype;

    @Column(name = "host_approval_status", nullable = false, length = 32)
    private String hostApprovalStatus = "approved";

    @Column(name = "stream_status", nullable = false, length = 32)
    private String streamStatus = "scheduled";

    @Column(name = "recording_url", length = 512)
    private String recordingUrl;

    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;

    @Column(name = "is_paid", nullable = false)
    private boolean paid;

    @Column(name = "price_inr_cents", nullable = false)
    private int priceInrCents;

    @Column(nullable = false)
    private boolean featured = false;

    @Column(name = "topics_covered", length = 2000)
    private String topicsCovered;

    @Column(length = 2000)
    private String requirements;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (!this.paid) {
            this.priceInrCents = 0;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
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

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getLocationOrLink() {
        return locationOrLink;
    }

    public void setLocationOrLink(String locationOrLink) {
        this.locationOrLink = locationOrLink;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }

    public int getMaxAttendees() {
        return maxAttendees;
    }

    public void setMaxAttendees(int maxAttendees) {
        this.maxAttendees = maxAttendees;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }

    public Set<UUID> getSpeakerIds() {
        return speakerIds;
    }

    public void setSpeakerIds(Set<UUID> speakerIds) {
        this.speakerIds = speakerIds;
    }

    public boolean isCancelled() {
        return cancelled;
    }

    public void setCancelled(boolean cancelled) {
        this.cancelled = cancelled;
    }

    public String getWebinarSubtype() {
        return webinarSubtype;
    }

    public void setWebinarSubtype(String webinarSubtype) {
        this.webinarSubtype = webinarSubtype;
    }

    public String getHostApprovalStatus() {
        return hostApprovalStatus;
    }

    public void setHostApprovalStatus(String hostApprovalStatus) {
        this.hostApprovalStatus = hostApprovalStatus;
    }

    public String getStreamStatus() {
        return streamStatus;
    }

    public void setStreamStatus(String streamStatus) {
        this.streamStatus = streamStatus;
    }

    public String getRecordingUrl() {
        return recordingUrl;
    }

    public void setRecordingUrl(String recordingUrl) {
        this.recordingUrl = recordingUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public boolean isPaid() {
        return paid;
    }

    public void setPaid(boolean paid) {
        this.paid = paid;
    }

    public int getPriceInrCents() {
        return priceInrCents;
    }

    public void setPriceInrCents(int priceInrCents) {
        this.priceInrCents = priceInrCents;
    }

    public boolean isFeatured() {
        return featured;
    }

    public void setFeatured(boolean featured) {
        this.featured = featured;
    }

    public String getTopicsCovered() {
        return topicsCovered;
    }

    public void setTopicsCovered(String topicsCovered) {
        this.topicsCovered = topicsCovered;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
