package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(3)
public class MentorProfileSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorProfileSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorProfileSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("mentor_profiles", "full_name", "VARCHAR(128)");
        addColumnIfMissing("mentor_profiles", "profile_image_url", "VARCHAR(512)");
        addColumnIfMissing("mentor_profiles", "company", "VARCHAR(128)");
        addColumnIfMissing("mentor_profiles", "designation", "VARCHAR(128)");
        addColumnIfMissing("mentor_profiles", "experience_range", "VARCHAR(64)");
        addColumnIfMissing("mentor_profiles", "location", "VARCHAR(128)");
        addColumnIfMissing("mentor_profiles", "expertise_tags", "VARCHAR(512)");
        addColumnIfMissing("mentor_profiles", "linkedin_url", "VARCHAR(256)");
        addColumnIfMissing("mentor_profiles", "github_url", "VARCHAR(256)");
        addColumnIfMissing("mentor_profiles", "portfolio_url", "VARCHAR(256)");
        addColumnIfMissing("mentor_profiles", "resume_url", "VARCHAR(512)");
        addColumnIfMissing("mentor_profiles", "mock_interview_price_cents", "INT");
        addColumnIfMissing("mentor_profiles", "resume_review_price_cents", "INT");
        addColumnIfMissing("mentor_profiles", "sessions_completed", "BIGINT DEFAULT 0");
        addColumnIfMissing("mentor_profiles", "admin_status", "VARCHAR(16) DEFAULT 'ACTIVE'");
        addColumnIfMissing("mentor_profiles", "response_rate", "DOUBLE DEFAULT 98");
        addColumnIfMissing("mentor_profiles", "email", "VARCHAR(256)");
        addColumnIfMissing("mentor_profiles", "phone", "VARCHAR(32)");
        addColumnIfMissing("mentor_profiles", "technologies", "VARCHAR(512)");
        addColumnIfMissing("mentor_profiles", "mentorship_categories", "VARCHAR(512)");
        addColumnIfMissing("mentor_profiles", "session_duration_minutes", "INT DEFAULT 60");
        addColumnIfMissing("mentor_profiles", "free_session_allowed", "BOOLEAN DEFAULT FALSE");
        log.info("Mentor profile schema migration complete");
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) {
            return;
        }
        jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
    }

    private boolean columnExists(String table, String column) {
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
    }
}
