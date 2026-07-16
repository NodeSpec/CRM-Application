-- 0012 — Companies / Account 360 (REQ-020)
CREATE TABLE companies (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    website       TEXT,
    domain        TEXT,
    industry      TEXT,
    segment       TEXT,
    owner_id      UUID REFERENCES users (id) ON DELETE SET NULL,
    about         TEXT,
    custom_fields JSONB NOT NULL DEFAULT '{}',
    created_by    UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_name ON companies (name);
CREATE INDEX idx_companies_industry ON companies (industry);
CREATE INDEX idx_companies_segment ON companies (segment);
CREATE INDEX idx_companies_owner ON companies (owner_id);
