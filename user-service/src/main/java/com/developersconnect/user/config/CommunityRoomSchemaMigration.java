package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(6)
public class CommunityRoomSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CommunityRoomSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public CommunityRoomSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("video_rooms", "featured", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("video_rooms", "featured_order", "INT DEFAULT 0 NOT NULL");
        addColumnIfMissing("video_rooms", "visibility", "VARCHAR(16) DEFAULT 'public' NOT NULL");
        addColumnIfMissing("video_rooms", "moderator_id", "UUID");
        ensureCategoriesTable();
    }

    private void ensureCategoriesTable() {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS community_room_categories (
                    id UUID PRIMARY KEY,
                    slug VARCHAR(64) NOT NULL UNIQUE,
                    label VARCHAR(128) NOT NULL,
                    description VARCHAR(500),
                    display_order INT NOT NULL DEFAULT 0,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
        } catch (Exception ex) {
            log.warn("Could not ensure community_room_categories table: {}", ex.getMessage());
        }
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) {
            return;
        }
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            log.info("Added column {}.{}", table, column);
        } catch (Exception ex) {
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
        } catch (Exception ex) {
            return false;
        }
    }
}
