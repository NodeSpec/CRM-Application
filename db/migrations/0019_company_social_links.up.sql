-- 0019 — Company social profile links (REQ-026)
-- Stores the company's official social profile URLs/handles per platform.
-- Shape: { "linkedin": "...", "x": "...", "instagram": "...", "tiktok": "..." }
-- Rendering a live post feed from these is done by the social-feed provider seam
-- and requires per-platform API credentials routed through the egress gateway.
ALTER TABLE companies
    ADD COLUMN social_links JSONB NOT NULL DEFAULT '{}';
