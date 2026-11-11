ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_file_id UUID;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(512);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS attachment_size BIGINT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(128);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS attachment_file_id UUID;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS code_content TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS code_language VARCHAR(32);

CREATE TABLE IF NOT EXISTS community_post_files (
    id UUID PRIMARY KEY,
    uploader_id UUID NOT NULL,
    stored_path VARCHAR(512) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    file_kind VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_post_polls (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL UNIQUE,
    question VARCHAR(300) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_post_poll_options (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL,
    option_text VARCHAR(120) NOT NULL,
    vote_count BIGINT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS community_post_poll_votes (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL,
    option_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_poll_vote_user UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_poll_options_poll ON community_post_poll_options (poll_id);
CREATE INDEX IF NOT EXISTS idx_community_post_poll_votes_poll ON community_post_poll_votes (poll_id);
