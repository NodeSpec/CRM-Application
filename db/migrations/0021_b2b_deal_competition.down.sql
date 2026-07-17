-- 0021 — B2B commercial deal depth + company competition (down)
DROP TABLE IF EXISTS company_competitors;
ALTER TABLE b2b_leads
    DROP COLUMN IF EXISTS meddic,
    DROP COLUMN IF EXISTS probability;
