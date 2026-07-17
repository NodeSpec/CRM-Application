-- 0020 — Compliance gate good/gap state + standard federal gate set (REQ-022)

-- Explicit "met" flag so a gate is clearly Good (met) or a Gap, instead of
-- inferring it from free-text status. `status` becomes the descriptive detail
-- (e.g. "TS/SCI · 6 cleared staff").
ALTER TABLE b2g_compliance_gates
    ADD COLUMN met BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill existing rows: mark met where the descriptive status reads positive.
UPDATE b2g_compliance_gates
   SET met = TRUE
 WHERE status ~* 'complete|done|pass|approved|on file|current|verified|authorized|110/110|il5|fedramp high';

-- Seed the standard federal gate set on the demo opportunity so the panel shows
-- a realistic mix of Good/Gap (idempotent — only inserts a label once).
INSERT INTO b2g_compliance_gates (opportunity_id, label, status, met)
SELECT o.id, g.label, g.status, g.met
FROM b2g_opportunities o
CROSS JOIN (VALUES
    ('Personnel Clearance',      'TS/SCI · 6 cleared staff',   TRUE),
    ('CMMC Level',               'CMMC 2.0 Level 2 · assessment due', FALSE),
    ('NIST SP 800-171',          '110/110 controls',           TRUE),
    ('ITAR',                     'DDTC registered · current',  TRUE),
    ('FedRAMP / Impact Level',   'FedRAMP High · IL5',         TRUE)
) AS g(label, status, met)
WHERE o.notice_id = 'NOTICE-2026-001'
  AND NOT EXISTS (
      SELECT 1 FROM b2g_compliance_gates x
       WHERE x.opportunity_id = o.id AND x.label = g.label
  );
