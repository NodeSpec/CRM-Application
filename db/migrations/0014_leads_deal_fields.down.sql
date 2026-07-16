-- 0014 — B2B lead deal fields (down)
ALTER TABLE b2b_leads
    DROP COLUMN IF EXISTS amount,
    DROP COLUMN IF EXISTS close_date,
    DROP COLUMN IF EXISTS owner_id,
    DROP COLUMN IF EXISTS company_id,
    DROP COLUMN IF EXISTS contact_id;
