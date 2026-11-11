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
public class MentorEarningsSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorEarningsSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorEarningsSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (tableExists("mentor_withdrawal_requests")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_withdrawal_requests (
                    id UUID PRIMARY KEY,
                    withdrawal_code VARCHAR(16) NOT NULL UNIQUE,
                    mentor_id UUID NOT NULL,
                    amount_cents BIGINT NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    note VARCHAR(500),
                    requested_at TIMESTAMP NOT NULL,
                    processed_at TIMESTAMP
                )
                """);
            log.info("Created table mentor_withdrawal_requests");
        } catch (Exception ex) {
            log.warn("Could not create mentor_withdrawal_requests: {}", ex.getMessage());
        }
    }

    private boolean tableExists(String table) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
                Integer.class,
                table.toUpperCase()
            );
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }
}
