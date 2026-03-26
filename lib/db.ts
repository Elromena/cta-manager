import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/drizzle/schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'cta-manager.db');

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// ── Initialize tables ────────────────────────────────────────────
export function initializeDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ctas (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      scope TEXT DEFAULT 'global',
      vertical TEXT,
      template_type TEXT DEFAULT 'standard',
      template_id TEXT,
      custom_html TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cta_content (
      id TEXT PRIMARY KEY,
      cta_id TEXT NOT NULL REFERENCES ctas(id) ON DELETE CASCADE,
      locale TEXT NOT NULL DEFAULT 'en',
      heading TEXT,
      body TEXT,
      button_text TEXT,
      button_url TEXT,
      image_url TEXT,
      UNIQUE(cta_id, locale)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      html_template TEXT NOT NULL,
      css TEXT,
      preview_image TEXT
    );

    CREATE TABLE IF NOT EXISTS cta_usage (
      id TEXT PRIMARY KEY,
      cta_slug TEXT NOT NULL,
      page_url TEXT NOT NULL,
      locale TEXT,
      last_seen_at TEXT,
      UNIQUE(cta_slug, page_url)
    );

    CREATE TABLE IF NOT EXISTS cta_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cta_slug TEXT NOT NULL,
      page_url TEXT NOT NULL,
      locale TEXT,
      event_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cta_stats_daily (
      cta_slug TEXT NOT NULL,
      page_url TEXT NOT NULL,
      locale TEXT,
      date TEXT NOT NULL,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      PRIMARY KEY (cta_slug, page_url, date)
    );
  `);
}

// Auto-initialize on import
initializeDb();
