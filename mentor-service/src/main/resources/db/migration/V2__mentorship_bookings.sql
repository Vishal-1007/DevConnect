CREATE TABLE mentorship_bookings (
    id UUID PRIMARY KEY,
    booking_code VARCHAR(16) NOT NULL UNIQUE,
    mentor_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    mentor_display_name VARCHAR(200) NOT NULL,
    learner_display_name VARCHAR(64) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    hourly_rate_cents INT NOT NULL DEFAULT 0,
    amount_cents INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    refund_status VARCHAR(32) NOT NULL DEFAULT 'none',
    notes VARCHAR(1000),
    scheduled_at_zone VARCHAR(64) DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE mentor_availability_slots (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    day_of_week INT NOT NULL,
    start_time VARCHAR(8) NOT NULL,
    end_time VARCHAR(8) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_bookings_status ON mentorship_bookings(status);
CREATE INDEX idx_bookings_mentor ON mentorship_bookings(mentor_id);
CREATE INDEX idx_bookings_scheduled ON mentorship_bookings(scheduled_at);
CREATE INDEX idx_availability_mentor ON mentor_availability_slots(mentor_id);
