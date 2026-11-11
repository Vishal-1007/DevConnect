package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class CommunityFeedSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CommunityFeedSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public CommunityFeedSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS community_post_saved (
                    post_id UUID NOT NULL,
                    user_id UUID NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (post_id, user_id)
                )
                """);
            addColumnIfMissing("community_post_comments", "parent_comment_id", "UUID");
            addColumnIfMissing("community_posts", "image_url", "VARCHAR(512)");
            addColumnIfMissing("community_posts", "image_file_id", "UUID");
            addColumnIfMissing("community_posts", "attachment_name", "VARCHAR(255)");
            addColumnIfMissing("community_posts", "attachment_url", "VARCHAR(512)");
            addColumnIfMissing("community_posts", "attachment_size", "BIGINT");
            addColumnIfMissing("community_posts", "attachment_type", "VARCHAR(128)");
            addColumnIfMissing("community_posts", "attachment_file_id", "UUID");
            addColumnIfMissing("community_posts", "code_content", "CLOB");
            addColumnIfMissing("community_posts", "code_language", "VARCHAR(32)");
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS community_post_files (
                    id UUID PRIMARY KEY,
                    uploader_id UUID NOT NULL,
                    stored_path VARCHAR(512) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    mime_type VARCHAR(128) NOT NULL,
                    size_bytes BIGINT NOT NULL,
                    file_kind VARCHAR(16) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS community_post_polls (
                    id UUID PRIMARY KEY,
                    post_id UUID NOT NULL UNIQUE,
                    question VARCHAR(300) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS community_post_poll_options (
                    id UUID PRIMARY KEY,
                    poll_id UUID NOT NULL,
                    option_text VARCHAR(120) NOT NULL,
                    vote_count BIGINT NOT NULL DEFAULT 0,
                    sort_order INT NOT NULL DEFAULT 0
                )
                """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS community_post_poll_votes (
                    id UUID PRIMARY KEY,
                    poll_id UUID NOT NULL,
                    option_id UUID NOT NULL,
                    user_id UUID NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
            log.debug("Community feed schema migration applied");
        } catch (Exception ex) {
            log.warn("Community feed schema migration skipped: {}", ex.getMessage());
        }
    }

    private void addColumnIfMissing(String table, String column, String type) {
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + type);
        } catch (Exception ignored) {
            // column already exists
        }
    }
}
