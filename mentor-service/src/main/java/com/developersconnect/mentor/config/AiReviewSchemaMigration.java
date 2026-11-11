package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(14)
public class AiReviewSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AiReviewSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public AiReviewSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing("ai_review_usage", """
            CREATE TABLE ai_review_usage (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL,
              review_date DATE NOT NULL,
              free_reviews_used INT NOT NULL DEFAULT 0,
              paid_reviews_available INT NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL,
              CONSTRAINT uq_ai_review_usage_user_date UNIQUE (user_id, review_date)
            )
            """);
        createTableIfMissing("ai_review_payment_credits", """
            CREATE TABLE ai_review_payment_credits (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL,
              payment_id UUID NOT NULL UNIQUE,
              created_at TIMESTAMP NOT NULL
            )
            """);
    }

    private void createTableIfMissing(String table, String ddl) {
        if (tableExists(table)) return;
        try {
            jdbc.execute(ddl);
            log.info("Created table {}", table);
        } catch (Exception ex) {
            log.warn("Could not create table {}: {}", table, ex.getMessage());
        }
    }

    private boolean tableExists(String table) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE UPPER(TABLE_NAME) = UPPER(?)",
                Integer.class, table
            );
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }
}
