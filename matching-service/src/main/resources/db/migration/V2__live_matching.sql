CREATE TABLE live_pool_members (
    user_id UUID PRIMARY KEY,
    role VARCHAR(16) NOT NULL,
    pool_status VARCHAR(16) NOT NULL,
    live_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    criteria VARCHAR(512),
    experience_level VARCHAR(32),
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE live_match_assignments (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL,
    criteria VARCHAR(512),
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_live_pool_mentor_available ON live_pool_members (role, pool_status, live_enabled, updated_at);
CREATE INDEX idx_live_pool_learner_waiting ON live_pool_members (role, pool_status, updated_at);
CREATE INDEX idx_live_assignments_mentor_status ON live_match_assignments (mentor_id, status);
CREATE INDEX idx_live_assignments_learner_status ON live_match_assignments (learner_id, status);
CREATE INDEX idx_live_assignments_pending_expiry ON live_match_assignments (status, expires_at);
