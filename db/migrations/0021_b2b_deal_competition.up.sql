-- 0021 — B2B commercial deal depth + company competition (REQ-021/020)

-- MEDDIC qualification + win probability on commercial deals (mirrors the B2G
-- opportunity's meddic JSONB). Additive — existing rows default to '{}' / NULL.
ALTER TABLE b2b_leads
    ADD COLUMN meddic      JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN probability INTEGER;

-- Competition lives on the COMPANY (a company has known competitors), not on the
-- pipeline row — so it is shared across Company 360 and any deal for that company.
CREATE TABLE company_competitors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    note        TEXT,
    disposition TEXT NOT NULL DEFAULT 'watch',  -- leading | threat | watch | low
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_competitors_company ON company_competitors (company_id);

-- Enrich the demo Acme deal + company so the commercial deal view is populated.
UPDATE b2b_leads b
   SET probability = 70,
       meddic = '{"metrics":"-30% QA time target","economic_buyer":"VP Ops engaged","decision_criteria":"Defined","pain":"Manual QA bottleneck","champion":"Dana Reyes"}'::jsonb
 WHERE b.company_name = 'Acme Robotics';

INSERT INTO company_competitors (company_id, name, note, disposition)
SELECT c.id, v.name, v.note, v.disposition
FROM companies c
CROSS JOIN (VALUES
    ('Rival Automation Co.', 'Incumbent at 2 plants, costly', 'threat'),
    ('Status quo (manual QA)', 'No cross-line visibility', 'low')
) AS v(name, note, disposition)
WHERE c.name = 'Acme Robotics'
  AND NOT EXISTS (
      SELECT 1 FROM company_competitors x WHERE x.company_id = c.id AND x.name = v.name
  );
