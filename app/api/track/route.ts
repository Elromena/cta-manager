import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ctaEvents, ctaStatsDaily } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/track
 * Log impression or click events from the client script.
 * Body: { events: [{ slug, pageUrl, locale, type: 'impression'|'click' }] }
 * 
 * Uses sendBeacon on the client side, so this must handle
 * both JSON and text/plain content types.
 */
export async function POST(request: NextRequest) {
  try {
    let body;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('text/plain')) {
      const text = await request.text();
      body = JSON.parse(text);
    } else {
      body = await request.json();
    }

    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'events array is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    for (const event of events) {
      const { slug, pageUrl, locale, type } = event;

      if (!slug || !pageUrl || !type) continue;
      if (type !== 'impression' && type !== 'click') continue;

      // Insert raw event
      db.insert(ctaEvents).values({
        ctaSlug: slug,
        pageUrl,
        locale: locale || 'en',
        eventType: type,
        createdAt: new Date().toISOString(),
      }).run();

      // Upsert daily stats
      const existingStat = db
        .select()
        .from(ctaStatsDaily)
        .where(
          and(
            eq(ctaStatsDaily.ctaSlug, slug),
            eq(ctaStatsDaily.pageUrl, pageUrl),
            eq(ctaStatsDaily.date, today)
          )
        )
        .get();

      if (existingStat) {
        if (type === 'impression') {
          db.update(ctaStatsDaily)
            .set({ impressions: (existingStat.impressions || 0) + 1 })
            .where(
              and(
                eq(ctaStatsDaily.ctaSlug, slug),
                eq(ctaStatsDaily.pageUrl, pageUrl),
                eq(ctaStatsDaily.date, today)
              )
            )
            .run();
        } else {
          db.update(ctaStatsDaily)
            .set({ clicks: (existingStat.clicks || 0) + 1 })
            .where(
              and(
                eq(ctaStatsDaily.ctaSlug, slug),
                eq(ctaStatsDaily.pageUrl, pageUrl),
                eq(ctaStatsDaily.date, today)
              )
            )
            .run();
        }
      } else {
        db.insert(ctaStatsDaily).values({
          ctaSlug: slug,
          pageUrl,
          locale: locale || 'en',
          date: today,
          impressions: type === 'impression' ? 1 : 0,
          clicks: type === 'click' ? 1 : 0,
        }).run();
      }
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('POST /api/track error:', error);
    return NextResponse.json({ error: 'Failed to track events' }, { status: 500 });
  }
}
