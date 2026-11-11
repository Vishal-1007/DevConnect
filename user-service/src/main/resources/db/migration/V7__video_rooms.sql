CREATE TABLE video_rooms (

    id UUID PRIMARY KEY,

    host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,

    description VARCHAR(1000) NOT NULL,

    category VARCHAR(32) NOT NULL DEFAULT 'general',

    max_participants INT NOT NULL DEFAULT 8,

    status VARCHAR(16) NOT NULL DEFAULT 'live',

    created_at TIMESTAMPTZ NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL,

    ended_at TIMESTAMPTZ

);



CREATE TABLE video_room_tags (

    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,

    tag VARCHAR(64) NOT NULL,

    PRIMARY KEY (room_id, tag)

);



CREATE TABLE video_room_participants (

    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,

    user_id UUID NOT NULL,

    joined_at TIMESTAMPTZ NOT NULL,

    PRIMARY KEY (room_id, user_id)

);



CREATE TABLE video_room_messages (

    id UUID PRIMARY KEY,

    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,

    author_id UUID NOT NULL,

    content VARCHAR(1000) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL

);



CREATE INDEX idx_video_rooms_status ON video_rooms(status);

CREATE INDEX idx_video_rooms_category ON video_rooms(category);

CREATE INDEX idx_video_rooms_created_at ON video_rooms(created_at);

CREATE INDEX idx_video_room_messages_room_id ON video_room_messages(room_id, created_at);

