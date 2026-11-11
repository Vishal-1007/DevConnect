package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(10)
public class MentorInterviewQuestionSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorInterviewQuestionSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorInterviewQuestionSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createQuestionsTable();
        createSavesTable();
    }

    private void createQuestionsTable() {
        if (tableExists("mentor_interview_questions")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_interview_questions (
                    id UUID PRIMARY KEY,
                    mentor_id UUID,
                    category VARCHAR(32) NOT NULL,
                    difficulty VARCHAR(16) NOT NULL,
                    question_text VARCHAR(2000) NOT NULL,
                    follow_ups CLOB,
                    evaluation_hints CLOB,
                    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
                    template BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_interview_questions");
        } catch (Exception ex) {
            log.warn("Could not create mentor_interview_questions: {}", ex.getMessage());
        }
    }

    private void createSavesTable() {
        if (tableExists("mentor_interview_question_saves")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_interview_question_saves (
                    mentor_id UUID NOT NULL,
                    question_id UUID NOT NULL,
                    saved_at TIMESTAMP NOT NULL,
                    PRIMARY KEY (mentor_id, question_id)
                )
                """);
            log.info("Created table mentor_interview_question_saves");
        } catch (Exception ex) {
            log.warn("Could not create mentor_interview_question_saves: {}", ex.getMessage());
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
