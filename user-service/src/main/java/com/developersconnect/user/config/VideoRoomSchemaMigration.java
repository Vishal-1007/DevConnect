package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures video room management columns exist (H2 local often skips Flyway).
 */
@Component
@Order(5)
public class VideoRoomSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(VideoRoomSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public VideoRoomSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("video_rooms", "room_type", "VARCHAR(32) DEFAULT 'public' NOT NULL");
        addColumnIfMissing("video_rooms", "use_case", "VARCHAR(32) DEFAULT 'community' NOT NULL");
        addColumnIfMissing("video_rooms", "parent_room_id", "UUID");
        addColumnIfMissing("video_rooms", "chat_enabled", "BOOLEAN DEFAULT TRUE NOT NULL");
        addColumnIfMissing("video_rooms", "screen_share_enabled", "BOOLEAN DEFAULT TRUE NOT NULL");
        addColumnIfMissing("video_rooms", "breakout_enabled", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("video_room_participants", "muted", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("video_room_participants", "can_speak", "BOOLEAN DEFAULT TRUE NOT NULL");
        addColumnIfMissing("video_room_participants", "hand_raised", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("video_room_participants", "left_at", "TIMESTAMP");
        addColumnIfMissing("video_room_participants", "participant_role", "VARCHAR(16) DEFAULT 'PARTICIPANT' NOT NULL");
        addColumnIfMissing("video_room_participants", "status", "VARCHAR(16) DEFAULT 'ACTIVE' NOT NULL");
        addColumnIfMissing("video_room_participants", "camera_enabled", "BOOLEAN DEFAULT TRUE NOT NULL");
        addColumnIfMissing("video_rooms", "room_code", "VARCHAR(32)");
        addColumnIfMissing("video_rooms", "expires_at", "TIMESTAMP");
        addColumnIfMissing("video_rooms", "is_premium_room", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("video_rooms", "expiry_warning_sent", "BOOLEAN DEFAULT FALSE NOT NULL");
        ensureSubscriptionTables();
        backfillRoomCodes();
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) {
            return;
        }
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            log.info("Added column {}.{}", table, column);
        } catch (DataAccessException ex) {
            log.warn("Could not add column {}.{}: {}", table, column, ex.getMessage());
        }
    }

    private boolean columnExists(String table, String column) {
        try {
            Integer count = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE UPPER(TABLE_NAME) = UPPER(?) AND UPPER(COLUMN_NAME) = UPPER(?)
                """,
                Integer.class,
                table,
                column
            );
            return count != null && count > 0;
        } catch (DataAccessException ex) {
            return false;
        }
    }

    private void ensureSubscriptionTables() {
        if (!tableExists("user_video_room_subscriptions")) {
            try {
                jdbc.execute("""
                    CREATE TABLE user_video_room_subscriptions (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL UNIQUE,
                        video_room_premium BOOLEAN DEFAULT FALSE NOT NULL,
                        payment_id UUID,
                        amount_cents INT,
                        purchase_date TIMESTAMP,
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP NOT NULL
                    )
                    """);
                log.info("Created table user_video_room_subscriptions");
            } catch (DataAccessException ex) {
                log.warn("Could not create user_video_room_subscriptions: {}", ex.getMessage());
            }
        }
        if (!tableExists("video_room_payment_transactions")) {
            try {
                jdbc.execute("""
                    CREATE TABLE video_room_payment_transactions (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL,
                        payment_id UUID NOT NULL UNIQUE,
                        amount_cents INT NOT NULL,
                        feature_type VARCHAR(32) NOT NULL,
                        status VARCHAR(16) NOT NULL,
                        created_at TIMESTAMP NOT NULL
                    )
                    """);
                log.info("Created table video_room_payment_transactions");
            } catch (DataAccessException ex) {
                log.warn("Could not create video_room_payment_transactions: {}", ex.getMessage());
            }
        }
    }

    private boolean tableExists(String table) {
        try {
            Integer count = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                WHERE UPPER(TABLE_NAME) = UPPER(?)
                """,
                Integer.class,
                table
            );
            return count != null && count > 0;
        } catch (DataAccessException ex) {
            return false;
        }
    }

    private void backfillRoomCodes() {
        try {
            jdbc.update("""
                UPDATE video_rooms SET room_code = LOWER(REPLACE(CAST(id AS VARCHAR), '-', ''))
                WHERE room_code IS NULL
                """);
        } catch (DataAccessException ex) {
            log.warn("Could not backfill room codes: {}", ex.getMessage());
        }
    }
}
