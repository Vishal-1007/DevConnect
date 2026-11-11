ALTER TABLE user_profiles
    ADD COLUMN role VARCHAR(64),
    ADD COLUMN experience_level VARCHAR(32),
    ADD COLUMN learning_goals VARCHAR(512),
    ADD COLUMN github_url VARCHAR(512),
    ADD COLUMN linkedin_url VARCHAR(512),
    ADD COLUMN portfolio_url VARCHAR(512);

CREATE TABLE user_profile_skills (
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill VARCHAR(64) NOT NULL,
    PRIMARY KEY (profile_id, skill)
);

CREATE TABLE user_ratings (
    id UUID PRIMARY KEY,
    rated_user_id UUID NOT NULL,
    rater_user_id UUID NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_user_rating UNIQUE (rated_user_id, rater_user_id)
);

CREATE INDEX idx_user_ratings_rated_user ON user_ratings(rated_user_id);
