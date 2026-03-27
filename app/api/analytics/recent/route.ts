import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ctaEvents } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

/**
 * GET /api/analytics/recent — Last 20 raw events for activity feed.
 */
export async function GET() {
  try {
    const db = getDb();
    const events = await db
      .select()
      .from(ctaEvents)
      .orderBy(desc(ctaEvents.createdAt))
      .limit(20);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('GET /api/analytics/recent error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch recent events', details: message }, { status: 500 });
  }
}
