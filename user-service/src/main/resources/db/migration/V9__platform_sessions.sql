CREATE TABLE platform_sessions (
    id UUID PRIMARY KEY,
    session_type VARCHAR(32) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    host_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'live',
    participant_count INT NOT NULL DEFAULT 0,
    max_participants INT NOT NULL DEFAULT 8,
    quality_score INT NOT NULL DEFAULT 85,
    duration_seconds BIGINT NOT NULL DEFAULT 0,
    recording_url VARCHAR(512),
    recording_available BOOLEAN NOT NULL DEFAULT FALSE,
    ai_moderation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    moderation_status VARCHAR(32) NOT NULL DEFAULT 'clear',
    report_count INT NOT NULL DEFAULT 0,
    linked_room_id UUID,
    linked_match_request_id UUID,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE session_reports (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES platform_sessions(id) ON DELETE CASCADE,
    reporter_id UUID,
    reason VARCHAR(64) NOT NULL,
    details VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_platform_sessions_status ON platform_sessions(status);
CREATE INDEX idx_platform_sessions_type ON platform_sessions(session_type);
CREATE INDEX idx_session_reports_session ON session_reports(session_id);
