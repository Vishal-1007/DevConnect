CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    saga_id UUID NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL,
    description VARCHAR(500) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    provider_reference VARCHAR(128),
    failure_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uk_payments_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_payments_user_created ON payments (user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status);

CREATE TABLE saga_instances (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL UNIQUE,
    saga_type VARCHAR(64) NOT NULL,
    state VARCHAR(32) NOT NULL,
    current_step VARCHAR(64) NOT NULL,
    correlation_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_saga_payment FOREIGN KEY (payment_id) REFERENCES payments (id)
);

CREATE INDEX idx_saga_state ON saga_instances (state);

CREATE TABLE saga_step_logs (
    id UUID PRIMARY KEY,
    saga_id UUID NOT NULL,
    step_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    message VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_saga_step_saga FOREIGN KEY (saga_id) REFERENCES saga_instances (id)
);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload_json TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_outbox_unpublished ON outbox_events (published_at, created_at);
