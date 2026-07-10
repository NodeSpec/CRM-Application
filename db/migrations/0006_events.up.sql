-- 0006 — Events (REQ-009)

CREATE TABLE events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name   TEXT NOT NULL,
    event_date   DATE NOT NULL,
    location     TEXT NOT NULL,
    website_url  TEXT,
    created_by   UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default sort is ascending by date; also used to split past vs upcoming.
CREATE INDEX idx_events_event_date ON events (event_date);
