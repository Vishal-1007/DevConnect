package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures platform session tables exist when Flyway is disabled (local H2).
 */
@Component
@Order(6)
public class PlatformSessionSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformSessionSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public PlatformSessionSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("platform_sessions")) {
            try {
                jdbc.execute("""
                    CREATE TABLE platform_sessions (
                        id UUID PRIMARY KEY,
                        session_type VARCHAR(32) NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        description VARCHAR(1000),
                        host_id UUID NOT NULL,
                        status VARCHAR(16) NOT NULL DEFAULT 'live',
                        participant_count INT NOT NULL DEFAULT 0,
                        max_participants INT NOT NULL DEFAULT 8,
                        quality_score INT NOT NULL DEFAULT 85,
                        duration_seconds BIGINT NOT NULL DEFAULT 0,
                        recording_url VARCHAR(512),
                        recording_available BOOLEAN NOT NULL DEFAULT FALSE,
                        ai_moderation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                        moderation_status VARCHAR(32) NOT NULL DEFAULT 'clear',
                        report_count INT NOT NULL DEFAULT 0,
                        linked_room_id UUID,
                        linked_match_request_id UUID,
                        started_at TIMESTAMP NOT NULL,
                        ended_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP NOT NULL
                    )
                    """);
                log.info("Created table platform_sessions");
            } catch (Exception ex) {
                log.warn("Could not create platform_sessions: {}", ex.getMessage());
            }
        }
        if (!tableExists("session_reports")) {
            try {
                jdbc.execute("""
                    CREATE TABLE session_reports (
                        id UUID PRIMARY KEY,
                        session_id UUID NOT NULL,
                        reporter_id UUID,
                        reason VARCHAR(64) NOT NULL,
                        details VARCHAR(1000),
                        created_at TIMESTAMP NOT NULL
                    )
                    """);
                log.info("Created table session_reports");
            } catch (Exception ex) {
                log.warn("Could not create session_reports: {}", ex.getMessage());
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
        } catch (Exception ex) {
            return false;
        }
    }
}
