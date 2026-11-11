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
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE mentor_payouts (
    id UUID PRIMARY KEY,
    payout_code VARCHAR(16) NOT NULL UNIQUE,
    mentor_id UUID NOT NULL,
    mentor_display_name VARCHAR(200) NOT NULL,
    amount_cents BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    linked_transaction_id UUID,
    failure_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE TABLE premium_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    username VARCHAR(64) NOT NULL,
    plan_id VARCHAR(32) NOT NULL,
    plan_name VARCHAR(64) NOT NULL,
    amount_cents BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    premium BOOLEAN NOT NULL DEFAULT TRUE,
    started_at TIMESTAMPTZ NOT NULL,
    renews_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_fin_tx_type ON financial_transactions(transaction_type);
CREATE INDEX idx_fin_tx_status ON financial_transactions(status);
CREATE INDEX idx_payouts_status ON mentor_payouts(status);
