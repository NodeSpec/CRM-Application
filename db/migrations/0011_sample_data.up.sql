-- 0011 — Sample/demo data (safe to remove)
-- Populates every module so list views and the dashboard are immediately
-- meaningful on a fresh deploy. Dates are relative to CURRENT_DATE so the
-- due-date / deadline / follow-up flags actually trigger. `created_by` is NULL
-- (records predate any login). Remove this migration for a clean production DB.

-- Events: one upcoming, one past.
INSERT INTO events (event_name, event_date, location, website_url) VALUES
    ('GovCon Summit 2026', CURRENT_DATE + 10, 'Washington, DC', 'https://example.com/govcon'),
    ('Legacy Tech Expo',   CURRENT_DATE - 20, 'Austin, TX',     'https://example.com/expo');

-- B2B leads: one due for follow-up (reminder in the past, open), one new.
INSERT INTO b2b_leads
    (company_name, industry_vertical, primary_poc, title_role, contact_email,
     lead_source, status, pain_point_use_case, initial_contact_date,
     next_follow_up_date, reminder_date, notes) VALUES
    ('Acme Robotics', 'Manufacturing', 'Dana Reyes', 'VP Ops',
     'dana@acme.example', 'Referral', 'Contacted', 'Manual QA bottleneck',
     CURRENT_DATE - 14, CURRENT_DATE - 1, CURRENT_DATE - 1,
     'Follow up on pilot proposal.'),
    ('Nimbus Analytics', 'SaaS', 'Sam Cole', 'CTO',
     'sam@nimbus.example', 'Website', 'New', 'Needs reporting integration',
     CURRENT_DATE - 2, CURRENT_DATE + 7, CURRENT_DATE + 5, 'Inbound demo request.');

-- B2G opportunities: due soon, past due, and closed.
INSERT INTO b2g_opportunities
    (notice_id, agency_department, opportunity_link, due_date,
     focus_area_rr_role, fit_score_numeric, status, action_officer, notes) VALUES
    ('NOTICE-2026-001', 'Dept. of Energy', 'https://sam.gov/opp/001',
     CURRENT_DATE + 7, 'Prime', 8, 'Open', 'J. Rivera', 'Strong fit.'),
    ('NOTICE-2026-002', 'GSA', 'https://sam.gov/opp/002',
     CURRENT_DATE - 5, 'Subcontractor', 5, 'Open', 'J. Rivera', 'Past due — triage.'),
    ('NOTICE-2025-099', 'DoD', 'https://sam.gov/opp/099',
     CURRENT_DATE - 40, 'Prime', 6, 'Closed-Lost', 'K. Ng', 'Awarded to competitor.');

-- Submissions: one pending with a near deadline, one already submitted.
INSERT INTO submissions (name, category_id, deadline, submission_date, website_url) VALUES
    ('Innovation Grant Q3',
     (SELECT id FROM submission_categories WHERE label = 'Grant'),
     CURRENT_DATE + 7, NULL, 'https://example.com/grant'),
    ('Keynote: DataConf',
     (SELECT id FROM submission_categories WHERE label = 'Speaking'),
     CURRENT_DATE - 10, CURRENT_DATE - 12, 'https://example.com/dataconf');

-- Publicity contacts across a few formats.
INSERT INTO publicity_contacts (organization, format, contact_name, email, notes) VALUES
    ('The Daily Ledger', 'Print', 'Morgan Lee', 'morgan@ledger.example', 'Business desk.'),
    ('TechTalk Podcast', 'Podcast', 'Alex Kim', 'alex@techtalk.example', 'Guest booking.'),
    ('Streamwave TV', 'TV', 'Priya Shah', 'priya@streamwave.example', 'Segment producer.');
