CREATE TABLE community_posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content VARCHAR(2000) NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE community_post_tags (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    tag VARCHAR(64) NOT NULL,
    PRIMARY KEY (post_id, tag)
);

CREATE TABLE community_post_likes (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE community_post_comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_post_comments_post ON community_post_comments(post_id);
