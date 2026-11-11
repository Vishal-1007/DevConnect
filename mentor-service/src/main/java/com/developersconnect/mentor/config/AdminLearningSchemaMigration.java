package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(12)
public class AdminLearningSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminLearningSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public AdminLearningSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing("learning_resource_categories", """
            CREATE TABLE learning_resource_categories (
                id UUID PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("learning_resources", """
            CREATE TABLE learning_resources (
                id UUID PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description CLOB,
                category_id UUID,
                category_name VARCHAR(120),
                tags VARCHAR(500),
                difficulty VARCHAR(16) NOT NULL DEFAULT 'BEGINNER',
                file_url VARCHAR(512),
                file_type VARCHAR(16),
                thumbnail_url VARCHAR(512),
                visibility VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
                download_count INT NOT NULL DEFAULT 0,
                view_count INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("saved_learning_resources", """
            CREATE TABLE saved_learning_resources (
                learner_id UUID NOT NULL,
                resource_id UUID NOT NULL,
                saved_at TIMESTAMP NOT NULL,
                PRIMARY KEY (learner_id, resource_id)
            )
            """);

        createTableIfMissing("learning_video_categories", """
            CREATE TABLE learning_video_categories (
                id UUID PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("learning_videos", """
            CREATE TABLE learning_videos (
                id UUID PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description CLOB,
                category_id UUID,
                category_name VARCHAR(120),
                tags VARCHAR(500),
                video_url VARCHAR(512),
                thumbnail_url VARCHAR(512),
                duration_seconds INT NOT NULL DEFAULT 0,
                visibility VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
                view_count INT NOT NULL DEFAULT 0,
                like_count INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("saved_learning_videos", """
            CREATE TABLE saved_learning_videos (
                learner_id UUID NOT NULL,
                video_id UUID NOT NULL,
                saved_at TIMESTAMP NOT NULL,
                PRIMARY KEY (learner_id, video_id)
            )
            """);

        createTableIfMissing("learning_video_playlists", """
            CREATE TABLE learning_video_playlists (
                id UUID PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description CLOB,
                thumbnail_url VARCHAR(512),
                visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC',
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("learning_video_playlist_items", """
            CREATE TABLE learning_video_playlist_items (
                playlist_id UUID NOT NULL,
                video_id UUID NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (playlist_id, video_id)
            )
            """);

        seedDefaultCategories();
        log.info("Admin learning schema migration complete");
    }

    private void seedDefaultCategories() {
        String[] resourceCategories = {
            "Java", "Spring Boot", "React", "Angular", "System Design", "SQL", "DSA",
            "Microservices", "AWS", "DevOps", "Career Guidance", "Interview Preparation"
        };
        for (int i = 0; i < resourceCategories.length; i++) {
            String name = resourceCategories[i];
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM learning_resource_categories WHERE name = ?",
                Integer.class,
                name
            );
            if (count != null && count == 0) {
                jdbc.update(
                    "INSERT INTO learning_resource_categories (id, name, sort_order, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                    java.util.UUID.randomUUID(), name, i
                );
            }
        }

        String[] videoCategories = {
            "Java", "Spring Boot", "React", "Angular", "SQL", "DSA",
            "System Design", "AWS", "DevOps", "Career Growth"
        };
        for (int i = 0; i < videoCategories.length; i++) {
            String name = videoCategories[i];
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM learning_video_categories WHERE name = ?",
                Integer.class,
                name
            );
            if (count != null && count == 0) {
                jdbc.update(
                    "INSERT INTO learning_video_categories (id, name, sort_order, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                    java.util.UUID.randomUUID(), name, i
                );
            }
        }
    }

    private void createTableIfMissing(String table, String ddl) {
        if (tableExists(table)) {
            return;
        }
        try {
            jdbc.execute(ddl);
            log.info("Created table {}", table);
        } catch (Exception ex) {
            log.warn("Could not create {}: {}", table, ex.getMessage());
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
