-- 0004 — B2B Leads + configurable status pipeline (REQ-004, REQ-005, REQ-006)

-- Admin-configurable lead status pipeline (REQ-005 AC1).
CREATE TABLE lead_statuses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    -- Marks terminal states (Closed-Won / Closed-Lost) for "not closed" filters.
    is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed the default pipeline from REQ-005; remains fully editable by an Admin.
INSERT INTO lead_statuses (label, sort_order, is_closed) VALUES
    ('New',         1, FALSE),
    ('Contacted',   2, FALSE),
    ('Qualified',   3, FALSE),
    ('Proposal',    4, FALSE),
    ('Closed-Won',  5, TRUE),
    ('Closed-Lost', 6, TRUE);

CREATE TABLE b2b_leads (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name          TEXT NOT NULL,
    industry_vertical     TEXT,
    primary_poc           TEXT,
    title_role            TEXT,
    contact_email         TEXT,
    lead_source           TEXT,
    -- References the configurable pipeline by label (kept as text for flexibility).
    status                TEXT NOT NULL DEFAULT 'New',
    pain_point_use_case   TEXT,
    initial_contact_date  DATE,
    next_follow_up_date   DATE,
    reminder_date         DATE,
    notes                 TEXT,
    created_by            UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes backing filter/sort/search and follow-up surfacing (REQ-006, REQ-005).
CREATE INDEX idx_b2b_leads_status ON b2b_leads (status);
CREATE INDEX idx_b2b_leads_industry ON b2b_leads (industry_vertical);
CREATE INDEX idx_b2b_leads_lead_source ON b2b_leads (lead_source);
CREATE INDEX idx_b2b_leads_next_follow_up ON b2b_leads (next_follow_up_date);
CREATE INDEX idx_b2b_leads_reminder_date ON b2b_leads (reminder_date);
