CREATE TABLE mentor_profiles (
    user_id UUID PRIMARY KEY,
    headline VARCHAR(128),
    bio VARCHAR(1024),
    hourly_rate_cents INT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
    rating_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_mentor_profiles_available ON mentor_profiles(available);
