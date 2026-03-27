-- Add variant support to CTA content
ALTER TABLE cta_content ADD COLUMN variant TEXT NOT NULL DEFAULT 'default';

-- Add variant to events and stats for per-variant analytics
ALTER TABLE cta_events ADD COLUMN variant TEXT DEFAULT 'default';
ALTER TABLE cta_stats_daily ADD COLUMN variant TEXT DEFAULT 'default';
ALTER TABLE cta_usage ADD COLUMN variant TEXT DEFAULT 'default';
