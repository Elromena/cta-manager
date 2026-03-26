import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ── CTAs ─────────────────────────────────────────────────────────
export const ctas = sqliteTable('ctas', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  scope: text('scope').default('global'), // 'global' | 'vertical' | 'article'
  vertical: text('vertical'),
  templateType: text('template_type').default('standard'), // 'standard' | 'custom'
  templateId: text('template_id'),
  customHtml: text('custom_html'),
  status: text('status').default('active'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// ── CTA Locale Content ───────────────────────────────────────────
export const ctaContent = sqliteTable('cta_content', {
  id: text('id').primaryKey(),
  ctaId: text('cta_id').notNull().references(() => ctas.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull().default('en'),
  heading: text('heading'),
  body: text('body'),
  buttonText: text('button_text'),
  buttonUrl: text('button_url'),
  imageUrl: text('image_url'),
});

// ── Templates ────────────────────────────────────────────────────
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  htmlTemplate: text('html_template').notNull(),
  css: text('css'),
  previewImage: text('preview_image'),
});

// ── Usage Tracking ───────────────────────────────────────────────
export const ctaUsage = sqliteTable('cta_usage', {
  id: text('id').primaryKey(),
  ctaSlug: text('cta_slug').notNull(),
  pageUrl: text('page_url').notNull(),
  locale: text('locale'),
  lastSeenAt: text('last_seen_at'),
});

// ── Analytics Events ─────────────────────────────────────────────
export const ctaEvents = sqliteTable('cta_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ctaSlug: text('cta_slug').notNull(),
  pageUrl: text('page_url').notNull(),
  locale: text('locale'),
  eventType: text('event_type').notNull(), // 'impression' | 'click'
  createdAt: text('created_at'),
});

// ── Daily Stats (Aggregated) ─────────────────────────────────────
export const ctaStatsDaily = sqliteTable('cta_stats_daily', {
  ctaSlug: text('cta_slug').notNull(),
  pageUrl: text('page_url').notNull(),
  locale: text('locale'),
  date: text('date').notNull(),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
});
