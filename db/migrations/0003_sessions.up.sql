-- 0003 — Server-side sessions & revocation storage (REQ-003)
-- Redis holds the hot session/revocation state for fast per-request checks;
-- this table is the durable record of issued sessions so an Admin can review
-- and force-terminate them, and so revocation survives a cache flush.

CREATE TABLE sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- Opaque session token id (also used as the Redis key suffix / cookie value).
    session_key  TEXT NOT NULL UNIQUE,
    -- JWT id from the IdP token, used for revocation matching.
    jti          TEXT,
    user_agent   TEXT,
    ip_address   INET,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Absolute expiry; idle timeout is enforced by sliding last_seen_at + TTL.
    expires_at   TIMESTAMPTZ NOT NULL,
    -- Set when logged out or administratively invalidated (REQ-003 AC3).
    revoked_at   TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX idx_sessions_jti ON sessions (jti);
