-- 0020 — Compliance gate good/gap state (down)
ALTER TABLE b2g_compliance_gates
    DROP COLUMN IF EXISTS met;
