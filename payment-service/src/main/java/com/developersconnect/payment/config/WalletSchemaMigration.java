package com.developersconnect.payment.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(6)
public class WalletSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(WalletSchemaMigration.class);

    private final JdbcTemplate jdbc;

    public WalletSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTable("wallets", """
            CREATE TABLE wallets (
                user_id UUID PRIMARY KEY,
                balance_cents BIGINT NOT NULL DEFAULT 0,
                currency VARCHAR(3) NOT NULL DEFAULT 'INR',
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        createTable("wallet_transactions", """
            CREATE TABLE wallet_transactions (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                amount_cents BIGINT NOT NULL,
                type VARCHAR(32) NOT NULL,
                description VARCHAR(500),
                call_id UUID,
                created_at TIMESTAMP NOT NULL
            )
            """);
        createTable("call_sessions", """
            CREATE TABLE call_sessions (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                mentor_id UUID NOT NULL,
                call_type VARCHAR(16) NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                duration_seconds BIGINT NOT NULL DEFAULT 0,
                amount_deducted_cents BIGINT NOT NULL DEFAULT 0,
                mentor_earning_cents BIGINT NOT NULL DEFAULT 0,
                platform_commission_cents BIGINT NOT NULL DEFAULT 0,
                price_per_minute_cents BIGINT NOT NULL,
                minutes_billed BIGINT NOT NULL DEFAULT 0,
                last_billed_at TIMESTAMP,
                status VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        createTable("marketplace_config", """
            CREATE TABLE marketplace_config (
                id VARCHAR(32) PRIMARY KEY,
                min_price_per_minute_cents BIGINT NOT NULL DEFAULT 500,
                max_price_per_minute_cents BIGINT NOT NULL DEFAULT 50000,
                platform_share_percent DOUBLE NOT NULL DEFAULT 50.0,
                updated_at TIMESTAMP NOT NULL
            )
            """);
        seedMarketplaceConfig();
    }

    private void seedMarketplaceConfig() {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM marketplace_config WHERE id = 'default'",
                Integer.class
            );
            if (count != null && count > 0) {
                return;
            }
            jdbc.update("""
                INSERT INTO marketplace_config (id, min_price_per_minute_cents, max_price_per_minute_cents, platform_share_percent, updated_at)
                VALUES ('default', 500, 50000, 50.0, CURRENT_TIMESTAMP)
                """);
            log.info("Seeded default marketplace config");
        } catch (Exception ex) {
            log.warn("Could not seed marketplace config: {}", ex.getMessage());
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
