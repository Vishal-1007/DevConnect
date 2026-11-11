package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(11)
public class LearningStreamsSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LearningStreamsSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public LearningStreamsSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing("learning_courses", """
            CREATE TABLE learning_courses (
                id UUID PRIMARY KEY,
                mentor_id UUID NOT NULL,
                mentor_display_name VARCHAR(120),
                title VARCHAR(200) NOT NULL,
                description CLOB,
                thumbnail_url VARCHAR(512),
                banner_url VARCHAR(512),
                pricing_type VARCHAR(16) NOT NULL DEFAULT 'FREE',
                price_cents INT NOT NULL DEFAULT 0,
                discount_price_cents INT,
                difficulty VARCHAR(16) NOT NULL DEFAULT 'BEGINNER',
                status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
                tags VARCHAR(500),
                what_you_learn CLOB,
                requirements CLOB,
                average_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
                rating_count INT NOT NULL DEFAULT 0,
                enrolled_count INT NOT NULL DEFAULT 0,
                like_count INT NOT NULL DEFAULT 0,
                total_duration_seconds INT NOT NULL DEFAULT 0,
                published_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("learning_course_sections", """
            CREATE TABLE learning_course_sections (
                id UUID PRIMARY KEY,
                course_id UUID NOT NULL,
                title VARCHAR(200) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("learning_lessons", """
            CREATE TABLE learning_lessons (
                id UUID PRIMARY KEY,
                course_id UUID NOT NULL,
                section_id UUID NOT NULL,
                title VARCHAR(200) NOT NULL,
                video_url VARCHAR(512),
                thumbnail_url VARCHAR(512),
                description CLOB,
                duration_seconds INT NOT NULL DEFAULT 0,
                sort_order INT NOT NULL DEFAULT 0,
                preview_free BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("mentor_followers", """
            CREATE TABLE mentor_followers (
                mentor_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL,
                PRIMARY KEY (mentor_id, learner_id)
            )
            """);

        createTableIfMissing("course_purchases", """
            CREATE TABLE course_purchases (
                id UUID PRIMARY KEY,
                course_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                payment_id UUID,
                amount_cents INT NOT NULL DEFAULT 0,
                status VARCHAR(16) NOT NULL DEFAULT 'COMPLETED',
                purchased_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("stream_cart_items", """
            CREATE TABLE stream_cart_items (
                id UUID PRIMARY KEY,
                learner_id UUID NOT NULL,
                course_id UUID NOT NULL,
                added_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("saved_courses", """
            CREATE TABLE saved_courses (
                learner_id UUID NOT NULL,
                course_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL,
                PRIMARY KEY (learner_id, course_id)
            )
            """);

        createTableIfMissing("course_likes", """
            CREATE TABLE course_likes (
                learner_id UUID NOT NULL,
                course_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL,
                PRIMARY KEY (learner_id, course_id)
            )
            """);

        createTableIfMissing("course_reviews", """
            CREATE TABLE course_reviews (
                id UUID PRIMARY KEY,
                course_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                learner_display_name VARCHAR(120),
                rating INT NOT NULL,
                comment CLOB,
                created_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("watch_progress", """
            CREATE TABLE watch_progress (
                id UUID PRIMARY KEY,
                learner_id UUID NOT NULL,
                course_id UUID NOT NULL,
                lesson_id UUID NOT NULL,
                progress_seconds INT NOT NULL DEFAULT 0,
                watched_duration_seconds INT NOT NULL DEFAULT 0,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        addColumnIfMissing(
            "watch_progress",
            "watched_duration_seconds",
            "ALTER TABLE watch_progress ADD COLUMN watched_duration_seconds INT NOT NULL DEFAULT 0"
        );
        addColumnIfMissing("learning_lessons", "thumbnail_url",
            "ALTER TABLE learning_lessons ADD COLUMN thumbnail_url VARCHAR(512)");
        addColumnIfMissing("learning_lessons", "description",
            "ALTER TABLE learning_lessons ADD COLUMN description CLOB");
        addColumnIfMissing("learning_courses", "creator_type",
            "ALTER TABLE learning_courses ADD COLUMN creator_type VARCHAR(16) NOT NULL DEFAULT 'MENTOR'");
        addColumnIfMissing("learning_courses", "category",
            "ALTER TABLE learning_courses ADD COLUMN category VARCHAR(64)");
        addColumnIfMissing("learning_courses", "currency",
            "ALTER TABLE learning_courses ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'INR'");
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

    private void addColumnIfMissing(String table, String column, String ddl) {
        if (!tableExists(table) || columnExists(table, column)) {
            return;
        }
        try {
            jdbc.execute(ddl);
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
