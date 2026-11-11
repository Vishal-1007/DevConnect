package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(7)
public class PlatformReportSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformReportSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public PlatformReportSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("platform_reports")) {
            try {
                jdbc.execute("""
                    CREATE TABLE platform_reports (
                        id UUID PRIMARY KEY,
                        report_code VARCHAR(16) NOT NULL UNIQUE,
                        category VARCHAR(32) NOT NULL,
                        target_type VARCHAR(32) NOT NULL,
                        target_id UUID,
                        target_summary VARCHAR(500) NOT NULL,
                        target_account_id UUID,
                        reporter_id UUID NOT NULL,
                        reporter_username VARCHAR(64) NOT NULL,
                        details VARCHAR(2000),
                        status VARCHAR(32) NOT NULL DEFAULT 'pending',
                        admin_action VARCHAR(32),
                        admin_note VARCHAR(1000),
                        reviewed_by_id UUID,
                        reviewed_by_username VARCHAR(64),
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP NOT NULL,
                        resolved_at TIMESTAMP
                    )
                    """);
                log.info("Created table platform_reports");
            } catch (Exception ex) {
                log.warn("Could not create platform_reports: {}", ex.getMessage());
            }
        }
        addColumnIfMissing("community_posts", "removed", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_posts", "flagged", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_posts", "auto_flagged", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_posts", "moderation_status", "VARCHAR(32) DEFAULT 'clear' NOT NULL");
        addColumnIfMissing("community_posts", "moderation_note", "VARCHAR(500)");
        addColumnIfMissing("community_posts", "flagged_at", "TIMESTAMP");
        createModerationFlagsTableIfMissing();
        addColumnIfMissing("discussion_threads", "pinned", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("discussion_threads", "pinned_order", "INTEGER DEFAULT 0 NOT NULL");
        addColumnIfMissing("discussion_threads", "removed", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_events", "cancelled", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_events", "webinar_subtype", "VARCHAR(32)");
        addColumnIfMissing("community_events", "host_approval_status", "VARCHAR(32) DEFAULT 'approved' NOT NULL");
        addColumnIfMissing("community_events", "stream_status", "VARCHAR(32) DEFAULT 'scheduled' NOT NULL");
        addColumnIfMissing("community_events", "recording_url", "VARCHAR(512)");
        addColumnIfMissing("community_event_registrations", "attended", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_event_registrations", "attended_at", "TIMESTAMP");
        createSpeakersTableIfMissing();
        createSystemLogsTableIfMissing();
        createFeatureFlagsTableIfMissing();
        createNotificationCampaignsTableIfMissing();
    }

    private void createModerationFlagsTableIfMissing() {
        if (tableExists("community_post_moderation_flags")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE community_post_moderation_flags (
                    post_id UUID NOT NULL,
                    flag VARCHAR(32) NOT NULL
                )
                """);
            log.info("Created table community_post_moderation_flags");
        } catch (Exception ex) {
            log.warn("Could not create community_post_moderation_flags: {}", ex.getMessage());
        }
    }

    private void createEventRolesTableIfMissing() {
        if (tableExists("community_event_roles")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE community_event_roles (
                    event_id UUID NOT NULL,
                    user_id UUID NOT NULL,
                    role VARCHAR(32) NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'approved',
                    applied_at TIMESTAMP NOT NULL,
                    PRIMARY KEY (event_id, user_id, role)
                )
                """);
            log.info("Created table community_event_roles");
        } catch (Exception ex) {
            log.warn("Could not create community_event_roles: {}", ex.getMessage());
        }
    }

    private void createSpeakersTableIfMissing() {
        if (tableExists("community_event_speakers")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE community_event_speakers (
                    event_id UUID NOT NULL,
                    speaker_id UUID NOT NULL,
                    PRIMARY KEY (event_id, speaker_id)
                )
                """);
            log.info("Created table community_event_speakers");
        } catch (Exception ex) {
            log.warn("Could not create community_event_speakers: {}", ex.getMessage());
        }
    }

    private void createSystemLogsTableIfMissing() {
        if (tableExists("platform_system_logs")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE platform_system_logs (
                    id UUID PRIMARY KEY,
                    level VARCHAR(16) NOT NULL,
                    service VARCHAR(64) NOT NULL,
                    category VARCHAR(32) NOT NULL,
                    message VARCHAR(1000) NOT NULL,
                    details VARCHAR(2000),
                    created_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table platform_system_logs");
        } catch (Exception ex) {
            log.warn("Could not create platform_system_logs: {}", ex.getMessage());
        }
    }

    private void createFeatureFlagsTableIfMissing() {
        if (tableExists("platform_feature_flags")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE platform_feature_flags (
                    feature_key VARCHAR(64) PRIMARY KEY,
                    label VARCHAR(128) NOT NULL,
                    description VARCHAR(500) NOT NULL,
                    category VARCHAR(32) NOT NULL,
                    enabled BOOLEAN NOT NULL,
                    critical BOOLEAN NOT NULL,
                    updated_by_username VARCHAR(64),
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table platform_feature_flags");
        } catch (Exception ex) {
            log.warn("Could not create platform_feature_flags: {}", ex.getMessage());
        }
    }

    private void createNotificationCampaignsTableIfMissing() {
        if (tableExists("platform_notification_campaigns")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE platform_notification_campaigns (
                    id UUID PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    body VARCHAR(4000) NOT NULL,
                    audience VARCHAR(32) NOT NULL,
                    notification_type VARCHAR(32) NOT NULL,
                    status VARCHAR(16) NOT NULL,
                    scheduled_at TIMESTAMP,
                    sent_at TIMESTAMP,
                    recipient_count INTEGER NOT NULL,
                    created_by_id UUID,
                    created_by_username VARCHAR(64),
                    created_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table platform_notification_campaigns");
        } catch (Exception ex) {
            log.warn("Could not create platform_notification_campaigns: {}", ex.getMessage());
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
