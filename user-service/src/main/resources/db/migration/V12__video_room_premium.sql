ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS room_code VARCHAR(32);
ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE video_rooms ADD COLUMN IF NOT EXISTS is_premium_room BOOLEAN DEFAULT FALSE NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_video_rooms_room_code ON video_rooms(room_code) WHERE room_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_video_room_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    video_room_premium BOOLEAN DEFAULT FALSE NOT NULL,
    payment_id UUID,
    amount_cents INT,
    purchase_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS video_room_payment_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    payment_id UUID NOT NULL UNIQUE,
    amount_cents INT NOT NULL,
    feature_type VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL
);
