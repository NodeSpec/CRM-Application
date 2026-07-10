-- 0005 — B2G Opportunities (REQ-007, REQ-008)

CREATE TABLE b2g_opportunities (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Notice ID must be unique; duplicates are rejected (REQ-007 AC1).
    notice_id               TEXT NOT NULL UNIQUE,
    agency_department       TEXT,
    opportunity_link        TEXT,
    due_date                DATE,
    focus_area_rr_role      TEXT,
    -- Fit Score: numeric 1-10 OR a configurable tier label (REQ-007 AC3).
    -- Stored flexibly; validation of the 1-10 / tier rule lives in the API.
    fit_score_numeric       SMALLINT CHECK (fit_score_numeric BETWEEN 1 AND 10),
    fit_score_tier          TEXT,
    possible_partner_company TEXT,
    partner_poc             TEXT,
    contact_email           TEXT,
    status                  TEXT NOT NULL DEFAULT 'Open',
    action_officer          TEXT,
    notes                   TEXT,
    created_by              UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes backing filter/sort and due-date alerting (REQ-008).
CREATE INDEX idx_b2g_status ON b2g_opportunities (status);
CREATE INDEX idx_b2g_agency ON b2g_opportunities (agency_department);
CREATE INDEX idx_b2g_focus_area ON b2g_opportunities (focus_area_rr_role);
CREATE INDEX idx_b2g_due_date ON b2g_opportunities (due_date);
