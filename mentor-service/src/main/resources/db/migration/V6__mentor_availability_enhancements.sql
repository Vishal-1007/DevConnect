ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS availability_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata';
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS auto_scheduling_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE mentor_recurring_plans (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    learner_name VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    frequency VARCHAR(32) NOT NULL DEFAULT 'weekly',
    day_of_week INT NOT NULL,
    start_time VARCHAR(8) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    next_session_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_recurring_plans_mentor ON mentor_recurring_plans(mentor_id);
