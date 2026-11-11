package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(7)
public class CodingChallengeSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CodingChallengeSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public CodingChallengeSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing(
            "coding_challenges",
            """
            CREATE TABLE coding_challenges (
              id UUID PRIMARY KEY,
              title VARCHAR(200) NOT NULL,
              description CLOB NOT NULL,
              difficulty VARCHAR(16) NOT NULL,
              category VARCHAR(32) NOT NULL,
              languages_json CLOB NOT NULL,
              tags_json CLOB NOT NULL,
              companies_json CLOB NOT NULL,
              starter_code_json CLOB NOT NULL,
              test_cases_json CLOB NOT NULL,
              solution CLOB,
              created_by UUID,
              creator_type VARCHAR(16) NOT NULL,
              published BOOLEAN NOT NULL DEFAULT TRUE,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL
            )
            """
        );
        createTableIfMissing(
            "coding_challenge_solves",
            """
            CREATE TABLE coding_challenge_solves (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL,
              challenge_id UUID NOT NULL,
              language VARCHAR(32) NOT NULL,
              solved_at TIMESTAMP NOT NULL
            )
            """
        );
        createIndexIfMissing(
            "idx_coding_challenge_solves_user",
            "CREATE INDEX idx_coding_challenge_solves_user ON coding_challenge_solves (user_id)"
        );
        createIndexIfMissing(
            "idx_coding_challenge_solves_challenge",
            "CREATE INDEX idx_coding_challenge_solves_challenge ON coding_challenge_solves (challenge_id)"
        );
        addColumnIfMissing("coding_challenges", "hints_json", "CLOB NOT NULL DEFAULT '[]'");
        addColumnIfMissing("coding_challenges", "constraints_json", "CLOB NOT NULL DEFAULT '[]'");
        addColumnIfMissing("coding_challenges", "examples_json", "CLOB NOT NULL DEFAULT '[]'");
        addColumnIfMissing("coding_challenges", "status", "VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED'");
        backfillStatusFromPublished();
        createTableIfMissing(
            "problem_attempts",
            """
            CREATE TABLE problem_attempts (
              id UUID PRIMARY KEY,
              student_id UUID NOT NULL,
              problem_id UUID NOT NULL,
              code CLOB,
              status VARCHAR(16) NOT NULL,
              language VARCHAR(32) NOT NULL,
              submitted_at TIMESTAMP NOT NULL
            )
            """
        );
        createIndexIfMissing(
            "idx_problem_attempts_student",
            "CREATE INDEX idx_problem_attempts_student ON problem_attempts (student_id)"
        );
        createIndexIfMissing(
            "idx_problem_attempts_problem",
            "CREATE INDEX idx_problem_attempts_problem ON problem_attempts (problem_id)"
        );
        createTableIfMissing(
            "practice_attempts",
            """
            CREATE TABLE practice_attempts (
              id UUID PRIMARY KEY,
              student_id UUID NOT NULL,
              problem_id UUID NOT NULL,
              code CLOB,
              language VARCHAR(32) NOT NULL,
              status VARCHAR(16) NOT NULL,
              mode VARCHAR(16) NOT NULL,
              started_at TIMESTAMP NOT NULL,
              completed_at TIMESTAMP,
              updated_at TIMESTAMP NOT NULL
            )
            """
        );
        createIndexIfMissing(
            "idx_practice_attempts_student",
            "CREATE INDEX idx_practice_attempts_student ON practice_attempts (student_id)"
        );
        createIndexIfMissing(
            "idx_practice_attempts_problem",
            "CREATE INDEX idx_practice_attempts_problem ON practice_attempts (problem_id)"
        );
    }

    private void backfillStatusFromPublished() {
        if (!columnExists("coding_challenges", "published")) {
            return;
        }
        try {
            jdbc.execute("UPDATE coding_challenges SET status = 'PUBLISHED' WHERE published = TRUE AND (status IS NULL OR status = '')");
            jdbc.execute("UPDATE coding_challenges SET status = 'DRAFT' WHERE published = FALSE AND (status IS NULL OR status = '' OR status = 'PUBLISHED')");
        } catch (Exception ex) {
            log.warn("Could not backfill coding_challenges.status: {}", ex.getMessage());
        }
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

    private void createTableIfMissing(String table, String ddl) {
        if (tableExists(table)) {
            return;
        }
        try {
            jdbc.execute(ddl);
            log.info("Created table {}", table);
        } catch (Exception ex) {
            log.warn("Could not create table {}: {}", table, ex.getMessage());
        }
    }

    private void createIndexIfMissing(String indexName, String ddl) {
        if (indexExists(indexName)) {
            return;
        }
        try {
            jdbc.execute(ddl);
            log.info("Created index {}", indexName);
        } catch (Exception ex) {
            log.warn("Could not create index {}: {}", indexName, ex.getMessage());
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

    private boolean indexExists(String indexName) {
        try {
            Integer count = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.INDEXES
                WHERE UPPER(INDEX_NAME) = UPPER(?)
                """,
                Integer.class,
                indexName
            );
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }
}
