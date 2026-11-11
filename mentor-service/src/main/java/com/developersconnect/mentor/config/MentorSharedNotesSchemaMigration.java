package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(9)
public class MentorSharedNotesSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorSharedNotesSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorSharedNotesSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (tableExists("mentor_shared_notes")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_shared_notes (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    content CLOB,
                    material_type VARCHAR(32) NOT NULL DEFAULT 'note',
                    tags VARCHAR(500),
                    file_name VARCHAR(255),
                    file_mime_type VARCHAR(128),
                    file_size_bytes BIGINT,
                    file_data_base64 CLOB,
                    shared_with_learner_ids VARCHAR(2000),
                    linked_booking_id UUID,
                    published BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_shared_notes");
        } catch (Exception ex) {
            log.warn("Could not create mentor_shared_notes: {}", ex.getMessage());
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
