CREATE TABLE match_requests (
    id UUID PRIMARY KEY,
    requester_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL,
    criteria VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE match_results (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES match_requests(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE user_match_index (
    user_id UUID PRIMARY KEY,
    experience_level VARCHAR(32),
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE user_match_index_skills (
    user_id UUID NOT NULL REFERENCES user_match_index(user_id) ON DELETE CASCADE,
    skill VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id, skill)
);

CREATE INDEX idx_match_requests_requester ON match_requests(requester_id);
