-- 0015 — B2G Capture (down)
DROP TABLE IF EXISTS b2g_compliance_gates;
DROP TABLE IF EXISTS b2g_stakeholders;
DROP TABLE IF EXISTS b2g_teaming_partners;
ALTER TABLE b2g_opportunities
    DROP COLUMN IF EXISTS naics,
    DROP COLUMN IF EXISTS set_aside,
    DROP COLUMN IF EXISTS incumbent,
    DROP COLUMN IF EXISTS solicitation_number,
    DROP COLUMN IF EXISTS clearance_level,
    DROP COLUMN IF EXISTS capture_stage,
    DROP COLUMN IF EXISTS meddic;
