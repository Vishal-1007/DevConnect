ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS featured_order INT NOT NULL DEFAULT 0;
ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS visibility VARCHAR(16) NOT NULL DEFAULT 'public';
ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS moderator_id UUID;

CREATE TABLE IF NOT EXISTS community_room_categories (
    id UUID PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(128) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_video_rooms_featured ON video_rooms(featured, featured_order);
CREATE INDEX IF NOT EXISTS idx_video_rooms_visibility ON video_rooms(visibility);
