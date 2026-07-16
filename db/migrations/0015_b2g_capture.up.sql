-- 0015 — B2G Federal Capture Management (REQ-022)
ALTER TABLE b2g_opportunities
    ADD COLUMN naics               TEXT,
    ADD COLUMN set_aside           TEXT,
    ADD COLUMN incumbent           TEXT,
    ADD COLUMN solicitation_number TEXT,
    ADD COLUMN clearance_level     TEXT,
    ADD COLUMN capture_stage       TEXT,
    -- MEDDIC qualification stored as JSONB (metrics, economic buyer, decision
    -- criteria/process, identify pain, champion, competition).
    ADD COLUMN meddic              JSONB NOT NULL DEFAULT '{}';

CREATE INDEX idx_b2g_capture_stage ON b2g_opportunities (capture_stage);

-- Teaming partners on an opportunity.
CREATE TABLE b2g_teaming_partners (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES b2g_opportunities (id) ON DELETE CASCADE,
    company_name   TEXT NOT NULL,
    role           TEXT,
    poc            TEXT,
    email          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_b2g_teaming_opp ON b2g_teaming_partners (opportunity_id);

-- Government stakeholders / decision makers.
CREATE TABLE b2g_stakeholders (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES b2g_opportunities (id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    agency_role    TEXT,
    influence      TEXT,
    disposition    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_b2g_stakeholders_opp ON b2g_stakeholders (opportunity_id);

-- Compliance & security gates (go/no-go).
CREATE TABLE b2g_compliance_gates (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES b2g_opportunities (id) ON DELETE CASCADE,
    label          TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_b2g_gates_opp ON b2g_compliance_gates (opportunity_id);
