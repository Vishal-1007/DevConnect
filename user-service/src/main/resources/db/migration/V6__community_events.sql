CREATE TABLE community_events (
    id UUID PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    event_type VARCHAR(32) NOT NULL DEFAULT 'webinar',
    category VARCHAR(32) NOT NULL DEFAULT 'general',
    format VARCHAR(16) NOT NULL DEFAULT 'online',
    location_or_link VARCHAR(512),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    max_attendees INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE community_event_tags (
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    tag VARCHAR(64) NOT NULL,
    PRIMARY KEY (event_id, tag)
);

CREATE TABLE community_event_registrations (
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_community_events_starts_at ON community_events(starts_at);
CREATE INDEX idx_community_events_category ON community_events(category);
