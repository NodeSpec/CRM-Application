-- 0018 — Sample expansion (down)
DELETE FROM activities WHERE subject IN ('Discovery call', 'Sent pilot proposal');
DELETE FROM tasks WHERE title IN (
    'Follow up on Acme pilot proposal',
    'Submit NOTICE-2026-001 capture plan',
    'Prep Q3 pipeline review');
DELETE FROM b2g_compliance_gates WHERE opportunity_id IN (SELECT id FROM b2g_opportunities WHERE notice_id = 'NOTICE-2026-001');
DELETE FROM b2g_stakeholders WHERE opportunity_id IN (SELECT id FROM b2g_opportunities WHERE notice_id = 'NOTICE-2026-001');
DELETE FROM b2g_teaming_partners WHERE opportunity_id IN (SELECT id FROM b2g_opportunities WHERE notice_id = 'NOTICE-2026-001');
UPDATE b2g_opportunities SET naics = NULL, set_aside = NULL, incumbent = NULL,
    solicitation_number = NULL, clearance_level = NULL, capture_stage = NULL, meddic = '{}'
WHERE notice_id = 'NOTICE-2026-001';
UPDATE b2b_leads SET amount = NULL, close_date = NULL, company_id = NULL
WHERE company_name IN ('Acme Robotics', 'Nimbus Analytics');
DELETE FROM contacts WHERE email IN ('dana@acme.example', 'sam@nimbus.example');
DELETE FROM companies WHERE name IN ('Acme Robotics', 'Nimbus Analytics', 'Harbor Foods');
