package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(6)
public class MentorshipRequestSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorshipRequestSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorshipRequestSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("mentorship_requests")) {
            jdbc.execute("""
                CREATE TABLE mentorship_requests (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    learner_id UUID NOT NULL,
                    learner_name VARCHAR(128),
                    goal VARCHAR(64) NOT NULL,
                    message CLOB,
                    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentorship_requests");
        }
    }

    private boolean tableExists(String table) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
            WHERE UPPER(TABLE_NAME) = UPPER(?)
            """,
            Integer.class,
            table
        );
        return count != null && count > 0;
    }
}
