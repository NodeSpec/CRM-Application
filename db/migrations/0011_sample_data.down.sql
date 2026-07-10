-- 0011 — Sample/demo data (down) — removes exactly the seeded rows.
DELETE FROM publicity_contacts WHERE email IN (
    'morgan@ledger.example', 'alex@techtalk.example', 'priya@streamwave.example');
DELETE FROM submissions WHERE name IN ('Innovation Grant Q3', 'Keynote: DataConf');
DELETE FROM b2g_opportunities WHERE notice_id IN (
    'NOTICE-2026-001', 'NOTICE-2026-002', 'NOTICE-2025-099');
DELETE FROM b2b_leads WHERE company_name IN ('Acme Robotics', 'Nimbus Analytics');
DELETE FROM events WHERE event_name IN ('GovCon Summit 2026', 'Legacy Tech Expo');
