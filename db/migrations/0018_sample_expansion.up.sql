-- 0018 — Sample data for the expanded modules (safe to remove).
-- Populates companies/contacts/deal amounts/activities/tasks and enriches the
-- seeded B2G opportunities with capture data so the new views are meaningful.

-- Companies (names match existing seeded lead company_name so links resolve).
INSERT INTO companies (name, website, domain, industry, segment, about) VALUES
    ('Acme Robotics', 'https://acme.example', 'acme.example', 'Manufacturing', 'Mid-Market', 'Industrial robotics & automation.'),
    ('Nimbus Analytics', 'https://nimbus.example', 'nimbus.example', 'SaaS', 'SMB', 'Cloud analytics platform.'),
    ('Harbor Foods', 'https://harbor.example', 'harbor.example', 'Food & Beverage', 'Enterprise', 'Regional food distributor.');

-- Contacts linked to those companies.
INSERT INTO contacts (full_name, title, email, phone, company_id, lifecycle_stage, tags, notes)
SELECT 'Dana Reyes', 'VP Operations', 'dana@acme.example', '+1-555-0101', c.id, 'SQL', ARRAY['champion'], 'Primary technical buyer.'
FROM companies c WHERE c.name = 'Acme Robotics';
INSERT INTO contacts (full_name, title, email, phone, company_id, lifecycle_stage, tags, notes)
SELECT 'Sam Cole', 'CTO', 'sam@nimbus.example', '+1-555-0102', c.id, 'Lead', ARRAY['inbound'], 'Requested a demo.'
FROM companies c WHERE c.name = 'Nimbus Analytics';

-- Turn the seeded leads into deals (amount / close date / company link).
UPDATE b2b_leads b SET amount = 42000, close_date = CURRENT_DATE + 21, company_id = c.id
FROM companies c WHERE c.name = 'Acme Robotics' AND b.company_name = 'Acme Robotics';
UPDATE b2b_leads b SET amount = 18500, close_date = CURRENT_DATE + 40, company_id = c.id
FROM companies c WHERE c.name = 'Nimbus Analytics' AND b.company_name = 'Nimbus Analytics';

-- Enrich the seeded B2G opportunity with capture data.
UPDATE b2g_opportunities SET
    naics = '541512', set_aside = 'Small Business', incumbent = 'Legacy Integrators LLC',
    solicitation_number = 'SOL-DOE-2026-001', clearance_level = 'Secret', capture_stage = 'Qualify',
    meddic = '{"metrics":"Reduce processing time 40%","economic_buyer":"CO J. Rivera","decision_criteria":"Past performance + price","decision_process":"RFP Q3","identify_pain":"Manual triage backlog","champion":"Program lead","competition":"Legacy Integrators"}'
WHERE notice_id = 'NOTICE-2026-001';

INSERT INTO b2g_teaming_partners (opportunity_id, company_name, role, poc, email)
SELECT id, 'SmallSat Systems', 'Subcontractor', 'A. Chen', 'achen@smallsat.example'
FROM b2g_opportunities WHERE notice_id = 'NOTICE-2026-001';
INSERT INTO b2g_stakeholders (opportunity_id, name, agency_role, influence, disposition)
SELECT id, 'J. Rivera', 'Contracting Officer', 'High', 'Neutral'
FROM b2g_opportunities WHERE notice_id = 'NOTICE-2026-001';
INSERT INTO b2g_compliance_gates (opportunity_id, label, status)
SELECT id, 'Facility Clearance (Secret)', 'in_progress'
FROM b2g_opportunities WHERE notice_id = 'NOTICE-2026-001';

-- Tasks (due today / overdue / upcoming).
INSERT INTO tasks (title, due_date, status, module) VALUES
    ('Follow up on Acme pilot proposal', CURRENT_DATE, 'open', 'b2b_leads'),
    ('Submit NOTICE-2026-001 capture plan', CURRENT_DATE - 1, 'open', 'b2g_opportunities'),
    ('Prep Q3 pipeline review', CURRENT_DATE + 3, 'open', NULL);

-- A couple of activities on the Acme company timeline.
INSERT INTO activities (type, subject, body, module, record_id, occurred_at)
SELECT 'call', 'Discovery call', 'Discussed QA bottleneck and pilot scope.', 'companies', c.id, now() - interval '2 hours'
FROM companies c WHERE c.name = 'Acme Robotics';
INSERT INTO activities (type, subject, body, module, record_id, occurred_at)
SELECT 'email', 'Sent pilot proposal', 'Emailed the 30-day pilot proposal.', 'companies', c.id, now() - interval '1 day'
FROM companies c WHERE c.name = 'Acme Robotics';
