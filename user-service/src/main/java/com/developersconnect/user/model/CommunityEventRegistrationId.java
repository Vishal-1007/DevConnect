package com.developersconnect.user.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class CommunityEventRegistrationId implements Serializable {

    private UUID eventId;
    private UUID userId;

    public CommunityEventRegistrationId() {
    }

    public CommunityEventRegistrationId(UUID eventId, UUID userId) {
        this.eventId = eventId;
        this.userId = userId;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof CommunityEventRegistrationId that)) {
            return false;
        }
        return Objects.equals(eventId, that.eventId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId, userId);
    }
}
