package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(11)
public class InterviewMarketplaceSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InterviewMarketplaceSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public InterviewMarketplaceSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        extendQuestionsTable();
        createQuestionSetsTable();
        createQuestionSetItemsTable();
        createAssignmentsTable();
        createSubmissionsTable();
        createFeedbackTable();
        createPurchasesTable();
        createPackReviewsTable();
    }

    private void extendQuestionsTable() {
        if (!tableExists("mentor_interview_questions")) {
            return;
        }
        addColumnIfMissing("mentor_interview_questions", "title", "VARCHAR(500)");
        addColumnIfMissing("mentor_interview_questions", "description", "CLOB");
        addColumnIfMissing("mentor_interview_questions", "expected_answer", "CLOB");
        addColumnIfMissing("mentor_interview_questions", "tags", "VARCHAR(500)");
        addColumnIfMissing("mentor_interview_questions", "estimated_minutes", "INT");
        addColumnIfMissing("mentor_interview_questions", "reference_links", "CLOB");
        addColumnIfMissing("mentor_interview_questions", "archived", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing("mentor_interview_questions", "deleted_at", "TIMESTAMP");
        addColumnIfMissing("mentor_interview_questions", "created_by", "UUID");
        addColumnIfMissing("mentor_interview_questions", "updated_by", "UUID");
    }

    private void createQuestionSetsTable() {
        if (tableExists("interview_question_sets")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_question_sets (
                id UUID PRIMARY KEY,
                mentor_id UUID NOT NULL,
                title VARCHAR(200) NOT NULL,
                description CLOB,
                instructions CLOB,
                duration_minutes INT NOT NULL DEFAULT 60,
                difficulty VARCHAR(16) NOT NULL DEFAULT 'medium',
                thumbnail_url VARCHAR(500),
                tags VARCHAR(500),
                visibility VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED_ONLY',
                price_cents INT NOT NULL DEFAULT 0,
                currency VARCHAR(8) NOT NULL DEFAULT 'INR',
                validity_days INT,
                status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
                published_at TIMESTAMP,
                avg_rating DECIMAL(4,2) NOT NULL DEFAULT 0,
                review_count INT NOT NULL DEFAULT 0,
                sales_count INT NOT NULL DEFAULT 0,
                deleted_at TIMESTAMP,
                created_by UUID,
                updated_by UUID,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        log.info("Created table interview_question_sets");
    }

    private void createQuestionSetItemsTable() {
        if (tableExists("interview_question_set_items")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_question_set_items (
                question_set_id UUID NOT NULL,
                question_id UUID NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (question_set_id, question_id)
            )
            """);
        log.info("Created table interview_question_set_items");
    }

    private void createAssignmentsTable() {
        if (tableExists("interview_question_assignments")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_question_assignments (
                id UUID PRIMARY KEY,
                question_set_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                mentor_id UUID NOT NULL,
                due_at TIMESTAMP,
                status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                assigned_at TIMESTAMP NOT NULL,
                submitted_at TIMESTAMP,
                deleted_at TIMESTAMP,
                created_by UUID,
                updated_by UUID,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        log.info("Created table interview_question_assignments");
    }

    private void createSubmissionsTable() {
        if (tableExists("interview_assignment_submissions")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_assignment_submissions (
                id UUID PRIMARY KEY,
                assignment_id UUID NOT NULL,
                question_id UUID NOT NULL,
                answer_type VARCHAR(16) NOT NULL DEFAULT 'TEXT',
                answer_text CLOB,
                answer_code CLOB,
                code_language VARCHAR(32),
                file_url VARCHAR(500),
                file_name VARCHAR(255),
                submitted_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        log.info("Created table interview_assignment_submissions");
    }

    private void createFeedbackTable() {
        if (tableExists("interview_mentor_feedback")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_mentor_feedback (
                id UUID PRIMARY KEY,
                assignment_id UUID NOT NULL,
                mentor_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                overall_score DECIMAL(4,2),
                strengths CLOB,
                improvements CLOB,
                recommendations CLOB,
                comments CLOB,
                reviewed_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        log.info("Created table interview_mentor_feedback");
    }

    private void createPurchasesTable() {
        if (tableExists("interview_question_set_purchases")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_question_set_purchases (
                id UUID PRIMARY KEY,
                question_set_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                payment_id UUID,
                amount_cents INT NOT NULL DEFAULT 0,
                currency VARCHAR(8) NOT NULL DEFAULT 'INR',
                status VARCHAR(16) NOT NULL DEFAULT 'COMPLETED',
                purchased_at TIMESTAMP NOT NULL,
                expires_at TIMESTAMP,
                deleted_at TIMESTAMP
            )
            """);
        log.info("Created table interview_question_set_purchases");
    }

    private void createPackReviewsTable() {
        if (tableExists("interview_pack_reviews")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE interview_pack_reviews (
                id UUID PRIMARY KEY,
                question_set_id UUID NOT NULL,
                learner_id UUID NOT NULL,
                rating INT NOT NULL,
                review_text VARCHAR(2000),
                created_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP
            )
            """);
        log.info("Created table interview_pack_reviews");
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) {
            return;
        }
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            log.info("Added column {}.{}", table, column);
        } catch (Exception ex) {
            log.warn("Could not add column {}.{}: {}", table, column, ex.getMessage());
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
