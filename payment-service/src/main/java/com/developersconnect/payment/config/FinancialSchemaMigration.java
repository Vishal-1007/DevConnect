package com.developersconnect.payment.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(5)
public class FinancialSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(FinancialSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public FinancialSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTable("financial_transactions", """
            CREATE TABLE financial_transactions (
                id UUID PRIMARY KEY,
                transaction_code VARCHAR(16) NOT NULL UNIQUE,
                transaction_type VARCHAR(32) NOT NULL,
                payer_user_id UUID,
                payer_display_name VARCHAR(64),
                payee_user_id UUID,
                payee_display_name VARCHAR(200),
                amount_cents BIGINT NOT NULL,
                currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                commission_cents BIGINT NOT NULL DEFAULT 0,
                platform_revenue_cents BIGINT NOT NULL DEFAULT 0,
                status VARCHAR(32) NOT NULL,
                linked_payment_id UUID,
                description VARCHAR(500),
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        createTable("mentor_payouts", """
            CREATE TABLE mentor_payouts (
                id UUID PRIMARY KEY,
                payout_code VARCHAR(16) NOT NULL UNIQUE,
                mentor_id UUID NOT NULL,
                mentor_display_name VARCHAR(200) NOT NULL,
                amount_cents BIGINT NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'pending',
                linked_transaction_id UUID,
                failure_reason VARCHAR(500),
                created_at TIMESTAMP NOT NULL,
                completed_at TIMESTAMP
            )
            """);
        createTable("premium_subscriptions", """
            CREATE TABLE premium_subscriptions (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                username VARCHAR(64) NOT NULL,
                plan_id VARCHAR(32) NOT NULL,
                plan_name VARCHAR(64) NOT NULL,
                amount_cents BIGINT NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                premium BOOLEAN NOT NULL DEFAULT TRUE,
                started_at TIMESTAMP NOT NULL,
                renews_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL
            )
            """);
        createTable("recruiter_subscriptions", """
            CREATE TABLE recruiter_subscriptions (
                id UUID PRIMARY KEY,
                recruiter_id UUID NOT NULL UNIQUE,
                plan_type VARCHAR(32) NOT NULL,
                start_date TIMESTAMP NOT NULL,
                expiry_date TIMESTAMP,
                status VARCHAR(32) NOT NULL,
                active_job_limit INT NOT NULL,
                candidate_search_limit INT NOT NULL,
                message_limit INT NOT NULL,
                recruiter_seat_limit INT NOT NULL,
                ai_report_limit INT NOT NULL,
                used_job_posts INT NOT NULL DEFAULT 0,
                used_searches INT NOT NULL DEFAULT 0,
                used_messages INT NOT NULL DEFAULT 0,
                used_ai_reports INT NOT NULL DEFAULT 0,
                usage_reset_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        createTable("recruiter_integrations", """
            CREATE TABLE recruiter_integrations (
                id UUID PRIMARY KEY,
                recruiter_id UUID NOT NULL,
                provider VARCHAR(32) NOT NULL,
                connected BOOLEAN NOT NULL DEFAULT FALSE,
                access_token VARCHAR(512),
                connected_email VARCHAR(320),
                connected_at TIMESTAMP,
                last_sync_at TIMESTAMP,
                sync_settings_json VARCHAR(4000),
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                CONSTRAINT uq_recruiter_integration UNIQUE (recruiter_id, provider)
            )
            """);
        addColumnIfMissing("recruiter_integrations", "sync_settings_json", "VARCHAR(4000)");
        addColumnIfMissing("recruiter_integrations", "refresh_token", "VARCHAR(2048)");
        addColumnIfMissing("recruiter_integrations", "token_expires_at", "TIMESTAMP");
        createTable("recruiter_oauth_states", """
            CREATE TABLE recruiter_oauth_states (
                id UUID PRIMARY KEY,
                state_token VARCHAR(64) NOT NULL UNIQUE,
                recruiter_id UUID NOT NULL,
                provider VARCHAR(32) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL
            )
            """);
    }

    private void addColumnIfMissing(String table, String column, String columnType) {
        if (!tableExists(table) || columnExists(table, column)) {
            return;
        }
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + columnType);
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

    private void createTable(String name, String ddl) {
        if (tableExists(name)) {
            return;
        }
        try {
            jdbc.execute(ddl);
            log.info("Created table {}", name);
        } catch (Exception ex) {
            log.warn("Could not create {}: {}", name, ex.getMessage());
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
