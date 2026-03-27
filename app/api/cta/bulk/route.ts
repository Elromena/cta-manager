import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ctas } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/cta/bulk — Bulk activate or deactivate CTAs.
 * Body: { slugs: string[], action: 'activate' | 'deactivate' }
 */
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { slugs, action } = body;

    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: 'slugs array is required' }, { status: 400 });
    }
    if (action !== 'activate' && action !== 'deactivate') {
      return NextResponse.json({ error: 'action must be activate or deactivate' }, { status: 400 });
    }

    const newStatus = action === 'activate' ? 'active' : 'inactive';
    const now = new Date().toISOString();

    for (const slug of slugs) {
      await db.update(ctas)
        .set({ status: newStatus, updatedAt: now })
        .where(eq(ctas.slug, slug));
    }

    return NextResponse.json({ success: true, updated: slugs.length });
  } catch (error) {
    console.error('PUT /api/cta/bulk error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to bulk update CTAs', details: message }, { status: 500 });
  }
}
