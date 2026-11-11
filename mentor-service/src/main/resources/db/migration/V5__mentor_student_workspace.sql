CREATE TABLE mentor_student_records (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    learner_name VARCHAR(64) NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'active_project',
    weak_area VARCHAR(64),
    strong_area VARCHAR(64),
    notes TEXT,
    interview_readiness_pct INT NOT NULL DEFAULT 0,
    interview_target VARCHAR(128),
    baseline_progress_pct INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_mentor_student UNIQUE (mentor_id, learner_id)
);

CREATE TABLE mentor_student_tasks (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE mentor_student_roadmap_items (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    milestone VARCHAR(64),
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_student_records_mentor ON mentor_student_records(mentor_id);
CREATE INDEX idx_student_tasks_mentor_learner ON mentor_student_tasks(mentor_id, learner_id);
CREATE INDEX idx_student_roadmap_mentor_learner ON mentor_student_roadmap_items(mentor_id, learner_id);
