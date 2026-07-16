-- 0017 — Custom Fields (REQ-023) — admin-defined fields per module.
-- Values are stored in a per-record `custom_fields` JSONB column (not EAV).
-- companies/contacts already have the column; add it to the pre-existing tables.

CREATE TABLE custom_field_defs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module      TEXT NOT NULL,                 -- b2b_leads, b2g_opportunities, ...
    key         TEXT NOT NULL,                 -- JSON key in the record's custom_fields
    label       TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'text',  -- text | number | date | select
    options     JSONB NOT NULL DEFAULT '[]',   -- for select
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (module, key)
);
CREATE INDEX idx_custom_field_defs_module ON custom_field_defs (module);

ALTER TABLE b2b_leads          ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE b2g_opportunities  ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE events             ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE submissions        ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE publicity_contacts ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}';
