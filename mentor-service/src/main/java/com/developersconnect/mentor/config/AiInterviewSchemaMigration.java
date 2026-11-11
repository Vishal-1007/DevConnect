package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(13)
public class AiInterviewSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AiInterviewSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public AiInterviewSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing("ai_interviews", """
            CREATE TABLE ai_interviews (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL,
              resume_url VARCHAR(512),
              candidate_name VARCHAR(128),
              target_role VARCHAR(128),
              experience_level VARCHAR(32),
              interview_type VARCHAR(32),
              resume_data TEXT,
              status VARCHAR(16) NOT NULL,
              score INT,
              technical_score INT,
              communication_score INT,
              problem_solving_score INT,
              confidence_score INT,
              strengths VARCHAR(2000),
              improvements VARCHAR(2000),
              recommended_topics VARCHAR(1000),
              intro_message VARCHAR(2000),
              question_count INT,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL,
              completed_at TIMESTAMP
            )
            """);
        createTableIfMissing("ai_interview_questions", """
            CREATE TABLE ai_interview_questions (
              id UUID PRIMARY KEY,
              interview_id UUID NOT NULL,
              question_order INT NOT NULL,
              question VARCHAR(2000) NOT NULL,
              user_answer VARCHAR(8000),
              ai_feedback VARCHAR(4000),
              score INT,
              question_type VARCHAR(32),
              technical_score INT,
              communication_score INT,
              grammar_score INT,
              confidence_score INT,
              feedback_json TEXT,
              created_at TIMESTAMP NOT NULL
            )
            """);
        addColumnIfMissing("ai_interviews", "difficulty_level", "INT DEFAULT 1");
        addColumnIfMissing("ai_interviews", "grammar_score", "INT");
        addColumnIfMissing("ai_interviews", "current_score", "INT");
        addColumnIfMissing("ai_interview_questions", "question_type", "VARCHAR(32)");
        addColumnIfMissing("ai_interview_questions", "technical_score", "INT");
        addColumnIfMissing("ai_interview_questions", "communication_score", "INT");
        addColumnIfMissing("ai_interview_questions", "grammar_score", "INT");
        addColumnIfMissing("ai_interview_questions", "confidence_score", "INT");
        addColumnIfMissing("ai_interview_questions", "feedback_json", "TEXT");
        addColumnIfMissing("ai_interviews", "context_json", "TEXT");
        addColumnIfMissing("ai_interview_questions", "topic", "VARCHAR(64)");
        addColumnIfMissing("ai_interview_questions", "difficulty", "VARCHAR(16)");
        addColumnIfMissing("ai_interview_questions", "answer_time_seconds", "INT");
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) return;
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD " + column + " " + definition);
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
                Integer.class, table, column
            );
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
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
