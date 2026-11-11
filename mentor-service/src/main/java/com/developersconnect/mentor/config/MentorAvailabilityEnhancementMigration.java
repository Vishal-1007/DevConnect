package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(7)
public class MentorAvailabilityEnhancementMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorAvailabilityEnhancementMigration.class);

    private final JdbcTemplate jdbc;

    public MentorAvailabilityEnhancementMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addProfileColumns();
        createRecurringPlansTable();
    }

    private void addProfileColumns() {
        try {
            if (!columnExists("mentor_profiles", "availability_timezone")) {
                jdbc.execute("ALTER TABLE mentor_profiles ADD COLUMN availability_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata'");
                log.info("Added mentor_profiles.availability_timezone");
            }
            if (!columnExists("mentor_profiles", "auto_scheduling_enabled")) {
                jdbc.execute("ALTER TABLE mentor_profiles ADD COLUMN auto_scheduling_enabled BOOLEAN NOT NULL DEFAULT TRUE");
                log.info("Added mentor_profiles.auto_scheduling_enabled");
            }
        } catch (Exception ex) {
            log.warn("Could not alter mentor_profiles: {}", ex.getMessage());
        }
    }

    private void createRecurringPlansTable() {
        if (tableExists("mentor_recurring_plans")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_recurring_plans (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    learner_id UUID NOT NULL,
                    learner_name VARCHAR(64) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    frequency VARCHAR(32) NOT NULL DEFAULT 'weekly',
                    day_of_week INT NOT NULL,
                    start_time VARCHAR(8) NOT NULL,
                    duration_minutes INT NOT NULL DEFAULT 60,
                    status VARCHAR(32) NOT NULL DEFAULT 'active',
                    next_session_at TIMESTAMP,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_recurring_plans");
        } catch (Exception ex) {
            log.warn("Could not create mentor_recurring_plans: {}", ex.getMessage());
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
}
