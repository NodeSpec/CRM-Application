-- 0010 — Audit Log (REQ-018)
-- Append-only record of every create/update/delete across all five modules.
-- Immutability is enforced at the application layer (no update/delete endpoints)
-- and reinforced here with a trigger that blocks UPDATE and DELETE.

CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');

CREATE TABLE audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Actor identity captured at write time (REQ-018 AC1).
    actor_user_id  UUID REFERENCES users (id) ON DELETE SET NULL,
    actor_name     TEXT NOT NULL,
    action         audit_action NOT NULL,
    -- Module/table the record belongs to, e.g. 'b2b_leads'.
    module         TEXT NOT NULL,
    record_id      UUID,
    -- Before/after snapshots of changed fields (REQ-018).
    before_data    JSONB,
    after_data     JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filter axes for the admin audit viewer (REQ-018 AC2).
CREATE INDEX idx_audit_module ON audit_log (module);
CREATE INDEX idx_audit_actor ON audit_log (actor_user_id);
CREATE INDEX idx_audit_action ON audit_log (action);
CREATE INDEX idx_audit_created_at ON audit_log (created_at);

-- Immutability guard (REQ-018 AC3): reject any attempt to modify audit rows.
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
