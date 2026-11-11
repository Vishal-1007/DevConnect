package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(5)
public class BookingSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BookingSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public BookingSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createBookingsTable();
        createAvailabilityTable();
    }

    private void createBookingsTable() {
        if (tableExists("mentorship_bookings")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentorship_bookings (
                    id UUID PRIMARY KEY,
                    booking_code VARCHAR(16) NOT NULL UNIQUE,
                    mentor_id UUID NOT NULL,
                    learner_id UUID NOT NULL,
                    mentor_display_name VARCHAR(200) NOT NULL,
                    learner_display_name VARCHAR(64) NOT NULL,
                    scheduled_at TIMESTAMP NOT NULL,
                    duration_minutes INT NOT NULL DEFAULT 60,
                    hourly_rate_cents INT NOT NULL DEFAULT 0,
                    amount_cents INT NOT NULL DEFAULT 0,
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    refund_status VARCHAR(32) NOT NULL DEFAULT 'none',
                    notes VARCHAR(1000),
                    scheduled_at_zone VARCHAR(64) DEFAULT 'UTC',
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL,
                    cancelled_at TIMESTAMP,
                    completed_at TIMESTAMP
                )
                """);
            log.info("Created table mentorship_bookings");
        } catch (Exception ex) {
            log.warn("Could not create mentorship_bookings: {}", ex.getMessage());
        }
    }

    private void createAvailabilityTable() {
        if (tableExists("mentor_availability_slots")) {
            return;
        }
        try {
            jdbc.execute("""
                CREATE TABLE mentor_availability_slots (
                    id UUID PRIMARY KEY,
                    mentor_id UUID NOT NULL,
                    day_of_week INT NOT NULL,
                    start_time VARCHAR(8) NOT NULL,
                    end_time VARCHAR(8) NOT NULL,
                    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL
                )
                """);
            log.info("Created table mentor_availability_slots");
        } catch (Exception ex) {
            log.warn("Could not create mentor_availability_slots: {}", ex.getMessage());
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
