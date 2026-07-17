-- 0017 — Custom Fields (down)
ALTER TABLE b2b_leads          DROP COLUMN IF EXISTS custom_fields;
ALTER TABLE b2g_opportunities  DROP COLUMN IF EXISTS custom_fields;
ALTER TABLE events             DROP COLUMN IF EXISTS custom_fields;
ALTER TABLE submissions        DROP COLUMN IF EXISTS custom_fields;
ALTER TABLE publicity_contacts DROP COLUMN IF EXISTS custom_fields;
DROP TABLE IF EXISTS custom_field_defs;
