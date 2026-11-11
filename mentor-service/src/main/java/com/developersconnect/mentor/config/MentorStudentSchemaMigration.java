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
public class MentorStudentSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorStudentSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorStudentSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createStudentRecordsTable();
        applyStudentRelationshipColumns();
        createStudentTasksTable();
        createRoadmapTable();
    }

    private void applyStudentRelationshipColumns() {
        if (!tableExists("mentor_student_records")) {
            return;
        }
        addColumnIfMissing("mentor_student_records", "status", "VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'");
        addColumnIfMissing("mentor_student_records", "accepted_at", "TIMESTAMP");
        try {
            jdbc.update("UPDATE mentor_student_records SET status = 'ACTIVE' WHERE status IS NULL");
            jdbc.update("UPDATE mentor_student_records SET accepted_at = created_at WHERE accepted_at IS NULL");
        } catch (Exception ex) {
            log.warn("Could not backfill mentor_student_records status columns: {}", ex.getMessage());
        }
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) {
            return;
        }
        jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        log.info("Added column {}.{}", table, column);
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

    private void createStudentRecordsTable() {
        if (tableExists("mentor_student_records")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_student_records (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    learner_id UUID NOT NULL,
                    learner_name VARCHAR(64) NOT NULL,
                    category VARCHAR(32) NOT NULL DEFAULT 'active_project',
                    weak_area VARCHAR(64),
                    strong_area VARCHAR(64),
                    notes CLOB,
                    interview_readiness_pct INT NOT NULL DEFAULT 0,
                    interview_target VARCHAR(128),
                    baseline_progress_pct INT NOT NULL DEFAULT 0,
                    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
                    accepted_at TIMESTAMP,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL,
                    CONSTRAINT uq_mentor_student UNIQUE (mentor_id, learner_id)
                )
                """);
            log.info("Created table mentor_student_records");
        } catch (Exception ex) {
            log.warn("Could not create mentor_student_records: {}", ex.getMessage());
        }
    }

    private void createStudentTasksTable() {
        if (tableExists("mentor_student_tasks")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_student_tasks (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    learner_id UUID NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description VARCHAR(1000),
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    due_date DATE,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_student_tasks");
        } catch (Exception ex) {
            log.warn("Could not create mentor_student_tasks: {}", ex.getMessage());
        }
    }

    private void createRoadmapTable() {
        if (tableExists("mentor_student_roadmap_items")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_student_roadmap_items (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    learner_id UUID NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    milestone VARCHAR(64),
                    sort_order INT NOT NULL DEFAULT 0,
                    status VARCHAR(32) NOT NULL DEFAULT 'active',
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_student_roadmap_items");
        } catch (Exception ex) {
            log.warn("Could not create mentor_student_roadmap_items: {}", ex.getMessage());
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
