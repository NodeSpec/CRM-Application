-- 0014 — B2B leads become deals: value/close/owner + company/contact links (REQ-021)
ALTER TABLE b2b_leads
    ADD COLUMN amount     NUMERIC(14, 2),
    ADD COLUMN close_date DATE,
    ADD COLUMN owner_id   UUID REFERENCES users (id) ON DELETE SET NULL,
    ADD COLUMN company_id UUID REFERENCES companies (id) ON DELETE SET NULL,
    ADD COLUMN contact_id UUID REFERENCES contacts (id) ON DELETE SET NULL;

CREATE INDEX idx_b2b_leads_owner ON b2b_leads (owner_id);
CREATE INDEX idx_b2b_leads_company ON b2b_leads (company_id);
CREATE INDEX idx_b2b_leads_close_date ON b2b_leads (close_date);
