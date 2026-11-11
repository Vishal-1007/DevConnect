CREATE TABLE platform_reports (
    id UUID PRIMARY KEY,
    report_code VARCHAR(16) NOT NULL UNIQUE,
    category VARCHAR(32) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id UUID,
    target_summary VARCHAR(500) NOT NULL,
    target_account_id UUID,
    reporter_id UUID NOT NULL,
    reporter_username VARCHAR(64) NOT NULL,
    details VARCHAR(2000),
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    admin_action VARCHAR(32),
    admin_note VARCHAR(1000),
    reviewed_by_id UUID,
    reviewed_by_username VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_platform_reports_status ON platform_reports(status);
CREATE INDEX idx_platform_reports_category ON platform_reports(category);
CREATE INDEX idx_platform_reports_target ON platform_reports(target_type, target_id);
