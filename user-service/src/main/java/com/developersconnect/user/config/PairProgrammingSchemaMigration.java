package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(6)
public class PairProgrammingSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PairProgrammingSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public PairProgrammingSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTableIfMissing(
            "pair_programming_sessions",
            """
            CREATE TABLE pair_programming_sessions (
              id UUID PRIMARY KEY,
              session_code VARCHAR(12) NOT NULL UNIQUE,
              host_id UUID NOT NULL,
              mentor_id UUID,
              assignment_id UUID,
              problem_id VARCHAR(64) NOT NULL,
              problem_title VARCHAR(200) NOT NULL,
              problem_description VARCHAR(2000) NOT NULL,
              language VARCHAR(32) NOT NULL,
              difficulty VARCHAR(16) NOT NULL,
              status VARCHAR(16) NOT NULL,
              current_code CLOB,
              host_role VARCHAR(16) NOT NULL,
              allow_mentor_edit BOOLEAN NOT NULL DEFAULT FALSE,
              started_at TIMESTAMP,
              ended_at TIMESTAMP,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL
            )
            """
        );
        createTableIfMissing(
            "pair_participants",
            """
            CREATE TABLE pair_participants (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL,
              user_id UUID NOT NULL,
              display_name VARCHAR(128),
              role VARCHAR(16) NOT NULL,
              mic_enabled BOOLEAN NOT NULL DEFAULT TRUE,
              camera_enabled BOOLEAN NOT NULL DEFAULT TRUE,
              joined_at TIMESTAMP NOT NULL,
              left_at TIMESTAMP
            )
            """
        );
        createTableIfMissing(
            "pair_code_snapshots",
            """
            CREATE TABLE pair_code_snapshots (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL,
              content CLOB NOT NULL,
              language VARCHAR(32) NOT NULL,
              saved_by UUID,
              saved_at TIMESTAMP NOT NULL
            )
            """
        );
        createTableIfMissing(
            "pair_chat_messages",
            """
            CREATE TABLE pair_chat_messages (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL,
              sender_id UUID NOT NULL,
              sender_name VARCHAR(128),
              message CLOB NOT NULL,
              message_type VARCHAR(16) NOT NULL,
              created_at TIMESTAMP NOT NULL
            )
            """
        );
        createTableIfMissing(
            "pair_session_notes",
            """
            CREATE TABLE pair_session_notes (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL UNIQUE,
              content CLOB NOT NULL,
              updated_by UUID,
              updated_at TIMESTAMP NOT NULL
            )
            """
        );
        createTableIfMissing(
            "pair_whiteboard_data",
            """
            CREATE TABLE pair_whiteboard_data (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL UNIQUE,
              json_data CLOB NOT NULL,
              updated_at TIMESTAMP NOT NULL
            )
            """
        );
        createTableIfMissing(
            "pair_session_recordings",
            """
            CREATE TABLE pair_session_recordings (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL,
              video_url VARCHAR(512),
              status VARCHAR(16) NOT NULL,
              started_at TIMESTAMP NOT NULL,
              stopped_at TIMESTAMP
            )
            """
        );
        createTableIfMissing(
            "pair_programming_invitations",
            """
            CREATE TABLE pair_programming_invitations (
              id UUID PRIMARY KEY,
              session_id UUID NOT NULL,
              sender_id UUID NOT NULL,
              receiver_id UUID NOT NULL,
              status VARCHAR(16) NOT NULL,
              created_at TIMESTAMP NOT NULL,
              responded_at TIMESTAMP
            )
            """
        );
        addColumnIfMissing("pair_programming_sessions", "creator_id", "UUID");
        addColumnIfMissing("pair_programming_sessions", "student_id", "UUID");
        addColumnIfMissing("pair_programming_sessions", "mode", "VARCHAR(16) NOT NULL DEFAULT 'PAIR'");
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
}
