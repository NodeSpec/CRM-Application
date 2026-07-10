-- 0007 — Submission Categories (REQ-011)
-- Admin-managed list backing the Submission.category dropdown. Deactivating a
-- category leaves existing records intact but blocks new use (REQ-011 AC3) —
-- enforced by the API which only offers is_active categories on create.

CREATE TABLE submission_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the example categories from REQ-011; remain fully editable by an Admin.
INSERT INTO submission_categories (label) VALUES
    ('Award'), ('Grant'), ('RFP'), ('Speaking');
