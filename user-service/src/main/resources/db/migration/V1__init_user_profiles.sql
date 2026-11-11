CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    display_name VARCHAR(128),
    bio VARCHAR(512),
    avatar_url VARCHAR(512),
    location VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
