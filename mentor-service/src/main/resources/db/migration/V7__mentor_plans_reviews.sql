CREATE TABLE mentor_mentorship_plans (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    plan_type VARCHAR(32) NOT NULL DEFAULT 'one_on_one',
    billing_type VARCHAR(32) NOT NULL DEFAULT 'one_time',
    price_cents INT NOT NULL DEFAULT 0,
    session_limit INT NOT NULL DEFAULT 1,
    duration_minutes INT NOT NULL DEFAULT 60,
    duration_label VARCHAR(64),
    premium_support BOOLEAN NOT NULL DEFAULT FALSE,
    popular BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    features TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE mentor_reviews (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    learner_id UUID,
    learner_name VARCHAR(64) NOT NULL,
    rating INT NOT NULL,
    review_text VARCHAR(2000) NOT NULL,
    topic VARCHAR(64),
    improvement_suggestion VARCHAR(1000),
    mentor_reply VARCHAR(2000),
    showcased BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    replied_at TIMESTAMPTZ
);

CREATE INDEX idx_mentor_plans_mentor ON mentor_mentorship_plans(mentor_id);
CREATE INDEX idx_mentor_reviews_mentor ON mentor_reviews(mentor_id);
