package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(8)
public class MentorPlansReviewsSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorPlansReviewsSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorPlansReviewsSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createPlansTable();
        createReviewsTable();
    }

    private void createPlansTable() {
        if (tableExists("mentor_mentorship_plans")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_mentorship_plans (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description VARCHAR(1000),
                    plan_type VARCHAR(32) NOT NULL DEFAULT 'one_on_one',
                    billing_type VARCHAR(32) NOT NULL DEFAULT 'one_time',
                    price_cents INT NOT NULL DEFAULT 0,
                    session_limit INT NOT NULL DEFAULT 1,
                    duration_minutes INT NOT NULL DEFAULT 60,
                    duration_label VARCHAR(64),
                    premium_support BOOLEAN NOT NULL DEFAULT FALSE,
                    popular BOOLEAN NOT NULL DEFAULT FALSE,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    sort_order INT NOT NULL DEFAULT 0,
                    features CLOB,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_mentorship_plans");
        } catch (Exception ex) {
            log.warn("Could not create mentor_mentorship_plans: {}", ex.getMessage());
        }
    }

    private void createReviewsTable() {
        if (tableExists("mentor_reviews")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_reviews (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    learner_id UUID,
                    learner_name VARCHAR(64) NOT NULL,
                    rating INT NOT NULL,
                    review_text VARCHAR(2000) NOT NULL,
                    topic VARCHAR(64),
                    improvement_suggestion VARCHAR(1000),
                    mentor_reply CLOB,
                    showcased BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL,
                    replied_at TIMESTAMP
                )
                """);
            log.info("Created table mentor_reviews");
        } catch (Exception ex) {
            log.warn("Could not create mentor_reviews: {}", ex.getMessage());
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
