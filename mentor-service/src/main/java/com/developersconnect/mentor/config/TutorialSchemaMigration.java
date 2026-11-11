package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(13)
public class TutorialSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TutorialSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public TutorialSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing("tutorials", """
            CREATE TABLE tutorials (
                id UUID PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description CLOB,
                category VARCHAR(120),
                difficulty VARCHAR(16) NOT NULL DEFAULT 'BEGINNER',
                tags VARCHAR(500),
                course_type VARCHAR(8) NOT NULL DEFAULT 'FREE',
                price_cents INT NOT NULL DEFAULT 0,
                created_by UUID NOT NULL,
                creator_type VARCHAR(8) NOT NULL,
                creator_name VARCHAR(120),
                status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
                published_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("tutorial_sections", """
            CREATE TABLE tutorial_sections (
                id UUID PRIMARY KEY,
                tutorial_id UUID NOT NULL,
                title VARCHAR(200) NOT NULL,
                order_index INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("tutorial_topics", """
            CREATE TABLE tutorial_topics (
                id UUID PRIMARY KEY,
                section_id UUID NOT NULL,
                tutorial_id UUID NOT NULL,
                title VARCHAR(200) NOT NULL,
                order_index INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("topic_contents", """
            CREATE TABLE topic_contents (
                id UUID PRIMARY KEY,
                topic_id UUID NOT NULL UNIQUE,
                html_content CLOB,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("tutorial_purchases", """
            CREATE TABLE tutorial_purchases (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                tutorial_id UUID NOT NULL,
                payment_id VARCHAR(120),
                payment_status VARCHAR(16) NOT NULL DEFAULT 'COMPLETED',
                amount_cents INT NOT NULL DEFAULT 0,
                purchased_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("tutorial_topic_progress", """
            CREATE TABLE tutorial_topic_progress (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                tutorial_id UUID NOT NULL,
                topic_id UUID NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                last_viewed_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);

        createTableIfMissing("saved_tutorials", """
            CREATE TABLE saved_tutorials (
                user_id UUID NOT NULL,
                tutorial_id UUID NOT NULL,
                saved_at TIMESTAMP NOT NULL,
                PRIMARY KEY (user_id, tutorial_id)
            )
            """);

        createTableIfMissing("bookmarked_tutorial_topics", """
            CREATE TABLE bookmarked_tutorial_topics (
                user_id UUID NOT NULL,
                topic_id UUID NOT NULL,
                tutorial_id UUID NOT NULL,
                bookmarked_at TIMESTAMP NOT NULL,
                PRIMARY KEY (user_id, topic_id)
            )
            """);

        createTableIfMissing("tutorial_cart_items", """
            CREATE TABLE tutorial_cart_items (
                user_id UUID NOT NULL,
                tutorial_id UUID NOT NULL,
                added_at TIMESTAMP NOT NULL,
                PRIMARY KEY (user_id, tutorial_id)
            )
            """);

        log.info("Tutorial schema migration complete");
    }

    private void createTableIfMissing(String table, String ddl) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE UPPER(TABLE_NAME) = ?",
                Integer.class,
                table.toUpperCase()
            );
            if (count != null && count > 0) return;
            jdbc.execute(ddl);
            log.info("Created table {}", table);
        } catch (Exception ex) {
            log.warn("Tutorial migration skipped for {}: {}", table, ex.getMessage());
        }
    }
}
