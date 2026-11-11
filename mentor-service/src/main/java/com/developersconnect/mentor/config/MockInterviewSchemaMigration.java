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
public class MockInterviewSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MockInterviewSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public MockInterviewSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing("mock_interviewers", """
            CREATE TABLE mock_interviewers (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL UNIQUE,
              headline VARCHAR(200),
              company VARCHAR(128),
              experience VARCHAR(64),
              skills VARCHAR(512),
              rating DOUBLE NOT NULL,
              total_reviews BIGINT NOT NULL,
              total_interviews BIGINT NOT NULL,
              hourly_rate_cents INT NOT NULL,
              bio VARCHAR(2000),
              profile_picture VARCHAR(512),
              online BOOLEAN NOT NULL DEFAULT FALSE,
              status VARCHAR(16) NOT NULL,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL
            )
            """);
        createTableIfMissing("mock_interview_requests", """
            CREATE TABLE mock_interview_requests (
              id UUID PRIMARY KEY,
              learner_id UUID NOT NULL,
              learner_name VARCHAR(128) NOT NULL,
              interviewer_id UUID NOT NULL,
              interview_type VARCHAR(64) NOT NULL,
              difficulty VARCHAR(16) NOT NULL,
              focus_topic VARCHAR(128) NOT NULL,
              message VARCHAR(1000),
              status VARCHAR(16) NOT NULL,
              scheduled_at TIMESTAMP,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL
            )
            """);
        createTableIfMissing("mock_interview_sessions", """
            CREATE TABLE mock_interview_sessions (
              id UUID PRIMARY KEY,
              request_id UUID NOT NULL UNIQUE,
              session_code VARCHAR(12) NOT NULL UNIQUE,
              room_id UUID NOT NULL,
              status VARCHAR(16) NOT NULL,
              started_at TIMESTAMP,
              ended_at TIMESTAMP,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL
            )
            """);
        createTableIfMissing("mock_interview_feedback", """
            CREATE TABLE mock_interview_feedback (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL UNIQUE,
              learner_id UUID NOT NULL,
              interviewer_id UUID NOT NULL,
              technical_score INT NOT NULL,
              communication_score INT NOT NULL,
              problem_solving_score INT NOT NULL,
              system_design_score INT NOT NULL,
              strengths VARCHAR(2000),
              weaknesses VARCHAR(2000),
              recommendations VARCHAR(2000),
              overall_rating DOUBLE NOT NULL,
              created_at TIMESTAMP NOT NULL
            )
            """);
        createTableIfMissing("mock_interview_favorites", """
            CREATE TABLE mock_interview_favorites (
              id UUID PRIMARY KEY,
              learner_id UUID NOT NULL,
              interviewer_user_id UUID NOT NULL,
              created_at TIMESTAMP NOT NULL
            )
            """);
        addColumnIfMissing("mock_interview_requests", "slot_end_at", "TIMESTAMP");
        addColumnIfMissing("mock_interview_requests", "duration_minutes", "INT");
        addColumnIfMissing("mock_interview_requests", "payment_id", "UUID");
        addColumnIfMissing("mock_interview_requests", "amount_cents", "INT");
        addColumnIfMissing("mock_interview_requests", "platform_fee_cents", "INT");
        addColumnIfMissing("mock_interview_requests", "payment_status", "VARCHAR(16)");
    }

    private void addColumnIfMissing(String table, String column, String sqlType) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE UPPER(TABLE_NAME) = UPPER(?) AND UPPER(COLUMN_NAME) = UPPER(?)",
                Integer.class, table, column
            );
            if (count != null && count > 0) {
                return;
            }
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + sqlType);
            log.info("Added column {}.{}", table, column);
        } catch (Exception ex) {
            log.warn("Could not add column {}.{}: {}", table, column, ex.getMessage());
        }
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
