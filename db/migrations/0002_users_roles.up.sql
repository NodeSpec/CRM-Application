-- 0002 — Users & RBAC storage (REQ-002)
-- Enforcement lives in the CRM API; this migration owns the persistence model.

-- Application roles. Minimum set required by REQ-002.
CREATE TYPE crm_role AS ENUM ('admin', 'member');

-- Users provisioned/updated on first login from IdP claims (REQ-001/002).
-- No local passwords are ever stored — authentication is delegated to the IdP.
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Stable subject identifier from the IdP token (the `sub` claim).
    idp_subject    TEXT NOT NULL UNIQUE,
    email          TEXT NOT NULL,
    display_name   TEXT NOT NULL DEFAULT '',
    -- Effective role. May be derived from IdP group claims or set by an Admin.
    role           crm_role NOT NULL DEFAULT 'member',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

-- Audit trail of explicit Admin-driven role assignments (REQ-002 AC2).
-- Distinct from `users.role` so we retain history of who changed what.
CREATE TABLE role_assignments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role          crm_role NOT NULL,
    assigned_by   UUID REFERENCES users (id) ON DELETE SET NULL,
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_assignments_user_id ON role_assignments (user_id);
