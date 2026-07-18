-- 0022 — Admin-configurable pipeline stages (REQ-021/022/023)
-- B2B stages already live in lead_statuses (0004). Give the federal capture
-- lifecycle the same treatment: a config table replacing the hardcoded list.
CREATE TABLE b2g_capture_stages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO b2g_capture_stages (label, sort_order) VALUES
    ('Identify', 1), ('Qualify', 2), ('Pursue', 3), ('Capture', 4),
    ('Proposal', 5), ('Submitted', 6), ('Award', 7);
