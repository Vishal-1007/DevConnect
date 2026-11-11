package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(4)
public class MentorApplicationSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorApplicationSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public MentorApplicationSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("mentor_applications", "current_step", "INT DEFAULT 1");
        addColumnIfMissing("mentor_applications", "application_data", "CLOB");
        addColumnIfMissing("mentor_applications", "admin_internal_notes", "CLOB");
        addColumnIfMissing("mentor_applications", "info_request_message", "VARCHAR(1024)");
        addColumnIfMissing("mentor_applications", "review_timeline", "CLOB");
        log.info("Mentor application schema migration complete");
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
