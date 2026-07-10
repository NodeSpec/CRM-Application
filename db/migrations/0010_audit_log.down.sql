-- 0010 — Audit Log (down)
DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
DROP FUNCTION IF EXISTS audit_log_immutable();
DROP TABLE IF EXISTS audit_log;
DROP TYPE IF EXISTS audit_action;
