-- 0016 — Activities & Tasks (REQ-024) — user-facing, distinct from audit_log

-- Logged activities (calls, emails, notes, meetings) attached to any record.
CREATE TABLE activities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
    type        TEXT NOT NULL DEFAULT 'note',   -- call | email | note | meeting
    subject     TEXT,
    body        TEXT,
    module      TEXT,                            -- e.g. companies, contacts, b2b_leads
    record_id   UUID,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_module_record ON activities (module, record_id);
CREATE INDEX idx_activities_occurred ON activities (occurred_at);

-- Tasks with due date + assignee, attachable to a record.
CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    due_date    DATE,
    assignee_id UUID REFERENCES users (id) ON DELETE SET NULL,
    status      TEXT NOT NULL DEFAULT 'open',    -- open | done
    module      TEXT,
    record_id   UUID,
    created_by  UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_due ON tasks (due_date);
CREATE INDEX idx_tasks_assignee ON tasks (assignee_id);
CREATE INDEX idx_tasks_status ON tasks (status);
