-- 0009 — Publicity Contacts + configurable Format list (REQ-012)

-- Admin-configurable Format dropdown (REQ-012 AC3).
CREATE TABLE publicity_formats (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO publicity_formats (label) VALUES
    ('Podcast'), ('Print'), ('Blog'), ('TV'), ('Online');

CREATE TABLE publicity_contacts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization  TEXT NOT NULL,
    -- Format label from the configurable list (kept as text for flexibility).
    format        TEXT,
    contact_name  TEXT,
    email         TEXT NOT NULL,
    notes         TEXT,
    created_by    UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes backing search by organization / contact / format (REQ-012 AC4)
-- and the dashboard "contacts by format" count (REQ-013).
CREATE INDEX idx_publicity_organization ON publicity_contacts (organization);
CREATE INDEX idx_publicity_contact_name ON publicity_contacts (contact_name);
CREATE INDEX idx_publicity_format ON publicity_contacts (format);
