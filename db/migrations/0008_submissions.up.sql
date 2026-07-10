-- 0008 — Submissions (REQ-010)

CREATE TABLE submissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    -- Category is required and constrained to the managed list (REQ-010/011).
    category_id      UUID NOT NULL REFERENCES submission_categories (id),
    deadline         DATE NOT NULL,
    -- Actual date submitted; NULL means pending. Presence => "Submitted".
    submission_date  DATE,
    website_url      TEXT,
    created_by       UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes backing deadline flagging and pending/submitted split (REQ-010).
CREATE INDEX idx_submissions_category_id ON submissions (category_id);
CREATE INDEX idx_submissions_deadline ON submissions (deadline);
CREATE INDEX idx_submissions_submission_date ON submissions (submission_date);
