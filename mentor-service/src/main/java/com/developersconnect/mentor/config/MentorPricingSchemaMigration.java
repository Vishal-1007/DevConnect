package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(25)
public class MentorPricingSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorPricingSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorPricingSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (tableExists("mentor_pricing")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_pricing (
                    mentor_id UUID PRIMARY KEY,
                    audio_price_per_minute_cents BIGINT NOT NULL DEFAULT 1500,
                    video_price_per_minute_cents BIGINT NOT NULL DEFAULT 2500,
                    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
                    instant_call_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
                    designation VARCHAR(128),
                    company VARCHAR(128),
                    experience_years INT,
                    expertise_tags VARCHAR(512),
                    linkedin_url VARCHAR(256),
                    sessions_completed BIGINT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_pricing");
        } catch (Exception ex) {
            log.warn("Could not create mentor_pricing: {}", ex.getMessage());
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
