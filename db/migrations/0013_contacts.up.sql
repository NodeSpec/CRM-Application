-- 0013 — Contacts (person-level) + configurable lifecycle stages (REQ-019)

-- Admin-configurable contact lifecycle stages.
CREATE TABLE contact_lifecycle_stages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO contact_lifecycle_stages (label, sort_order) VALUES
    ('Subscriber', 1), ('Lead', 2), ('MQL', 3), ('SQL', 4),
    ('Opportunity', 5), ('Customer', 6), ('Evangelist', 7);

-- Person-level contacts, distinct from publicity_contacts.
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    title           TEXT,
    email           TEXT,
    phone           TEXT,
    company_id      UUID REFERENCES companies (id) ON DELETE SET NULL,
    owner_id        UUID REFERENCES users (id) ON DELETE SET NULL,
    lifecycle_stage TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    notes           TEXT,
    custom_fields   JSONB NOT NULL DEFAULT '{}',
    created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_full_name ON contacts (full_name);
CREATE INDEX idx_contacts_company ON contacts (company_id);
CREATE INDEX idx_contacts_owner ON contacts (owner_id);
CREATE INDEX idx_contacts_lifecycle ON contacts (lifecycle_stage);
