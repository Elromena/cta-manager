import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ctaStatsDaily, ctaUsage } from '@/drizzle/schema';
import { eq, sql, desc } from 'drizzle-orm';

/**
 * GET /api/analytics?slug=book-demo&days=30
 * Returns analytics data for a specific CTA.
 */
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    if (!slug) {
      // Return overview stats for all CTAs
      const stats = db
        .select({
          ctaSlug: ctaStatsDaily.ctaSlug,
          totalImpressions: sql<number>`SUM(${ctaStatsDaily.impressions})`,
          totalClicks: sql<number>`SUM(${ctaStatsDaily.clicks})`,
        })
        .from(ctaStatsDaily)
        .where(sql`${ctaStatsDaily.date} >= date('now', '-' || ${days} || ' days')`)
        .groupBy(ctaStatsDaily.ctaSlug)
        .all();

      return NextResponse.json({ stats, days });
    }

    // Detailed stats for a specific CTA
    const dailyStats = db
      .select()
      .from(ctaStatsDaily)
      .where(sql`${ctaStatsDaily.ctaSlug} = ${slug} AND ${ctaStatsDaily.date} >= date('now', '-' || ${days} || ' days')`)
      .orderBy(desc(ctaStatsDaily.date))
      .all();

    // Per-page breakdown
    const pageBreakdown = db
      .select({
        pageUrl: ctaStatsDaily.pageUrl,
        locale: ctaStatsDaily.locale,
        totalImpressions: sql<number>`SUM(${ctaStatsDaily.impressions})`,
        totalClicks: sql<number>`SUM(${ctaStatsDaily.clicks})`,
      })
      .from(ctaStatsDaily)
      .where(sql`${ctaStatsDaily.ctaSlug} = ${slug} AND ${ctaStatsDaily.date} >= date('now', '-' || ${days} || ' days')`)
      .groupBy(ctaStatsDaily.pageUrl, ctaStatsDaily.locale)
      .all();

    // Daily trend
    const dailyTrend = db
      .select({
        date: ctaStatsDaily.date,
        impressions: sql<number>`SUM(${ctaStatsDaily.impressions})`,
        clicks: sql<number>`SUM(${ctaStatsDaily.clicks})`,
      })
      .from(ctaStatsDaily)
      .where(sql`${ctaStatsDaily.ctaSlug} = ${slug} AND ${ctaStatsDaily.date} >= date('now', '-' || ${days} || ' days')`)
      .groupBy(ctaStatsDaily.date)
      .orderBy(ctaStatsDaily.date)
      .all();

    // Total usage count
    const usageCount = db
      .select()
      .from(ctaUsage)
      .where(eq(ctaUsage.ctaSlug, slug))
      .all();

    const totals = dailyStats.reduce(
      (acc, s) => ({
        impressions: acc.impressions + (s.impressions || 0),
        clicks: acc.clicks + (s.clicks || 0),
      }),
      { impressions: 0, clicks: 0 }
    );

    return NextResponse.json({
      slug,
      days,
      totals: {
        ...totals,
        ctr: totals.impressions > 0
          ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%'
          : '0%',
      },
      dailyTrend,
      pageBreakdown,
      articlesUsing: usageCount.length,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
