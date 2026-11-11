package com.developersconnect.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(8)
public class EventCommerceSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EventCommerceSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public EventCommerceSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("community_events", "thumbnail_url", "VARCHAR(512)");
        addColumnIfMissing("community_events", "is_paid", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_events", "price_inr_cents", "INT DEFAULT 0 NOT NULL");
        addColumnIfMissing("community_events", "featured", "BOOLEAN DEFAULT FALSE NOT NULL");
        addColumnIfMissing("community_events", "topics_covered", "VARCHAR(2000)");
        addColumnIfMissing("community_events", "requirements", "VARCHAR(2000)");
        addColumnIfMissing("community_event_registrations", "payment_status", "VARCHAR(16) DEFAULT 'free' NOT NULL");
        addColumnIfMissing("community_event_registrations", "amount_paid_cents", "INT DEFAULT 0 NOT NULL");
        ensureTable("event_payments", """
            CREATE TABLE event_payments (
                id UUID PRIMARY KEY,
                event_id UUID NOT NULL,
                user_id UUID NOT NULL,
                mentor_id UUID NOT NULL,
                payment_id UUID NOT NULL UNIQUE,
                amount_cents INT NOT NULL,
                mentor_share_cents INT NOT NULL,
                platform_share_cents INT NOT NULL,
                status VARCHAR(16) NOT NULL,
                created_at TIMESTAMP NOT NULL
            )
            """);
        ensureTable("mentor_wallets", """
            CREATE TABLE mentor_wallets (
                mentor_id UUID PRIMARY KEY,
                available_balance_cents INT DEFAULT 0 NOT NULL,
                total_earning_cents INT DEFAULT 0 NOT NULL,
                withdrawn_amount_cents INT DEFAULT 0 NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        ensureTable("event_withdrawals", """
            CREATE TABLE event_withdrawals (
                id UUID PRIMARY KEY,
                mentor_id UUID NOT NULL,
                amount_cents INT NOT NULL,
                status VARCHAR(16) NOT NULL,
                admin_note VARCHAR(500),
                requested_at TIMESTAMP NOT NULL,
                resolved_at TIMESTAMP
            )
            """);
        ensureTable("event_bookmarks", """
            CREATE TABLE event_bookmarks (
                event_id UUID NOT NULL,
                user_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL,
                PRIMARY KEY (event_id, user_id)
            )
            """);
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

    private void ensureTable(String table, String ddl) {
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
