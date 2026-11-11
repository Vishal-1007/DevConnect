ALTER TABLE community_post_comments
    ADD COLUMN IF NOT EXISTS parent_comment_id UUID;

CREATE TABLE IF NOT EXISTS community_post_saved (
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_saved_user ON community_post_saved (user_id);
