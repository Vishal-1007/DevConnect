CREATE TABLE discussion_threads (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content VARCHAR(4000) NOT NULL,
    topic VARCHAR(32) NOT NULL DEFAULT 'general',
    solved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE discussion_thread_tags (
    thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
    tag VARCHAR(64) NOT NULL,
    PRIMARY KEY (thread_id, tag)
);

CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content VARCHAR(2000) NOT NULL,
    accepted_answer BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_discussion_threads_created_at ON discussion_threads(created_at DESC);
CREATE INDEX idx_discussion_threads_topic ON discussion_threads(topic);
CREATE INDEX idx_discussion_replies_thread ON discussion_replies(thread_id);
