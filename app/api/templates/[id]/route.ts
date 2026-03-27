import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { templates } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { STANDARD_TEMPLATES } from '@/lib/templates';

const STANDARD_IDS = ['banner', 'card', 'inline', 'image-text'];

/**
 * GET /api/templates/[id] — Fetch a single template by ID.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const rows = await db.select().from(templates).where(eq(templates.id, id));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const row = rows[0];
    const std = STANDARD_TEMPLATES.find((s) => s.id === row.id);
    const enriched = {
      ...row,
      description: std?.description || (row.category === 'custom' ? 'Custom template' : ''),
      category: STANDARD_IDS.includes(row.id) ? 'standard' : (row.category || 'custom'),
    };

    return NextResponse.json({ template: enriched });
  } catch (error) {
    console.error('GET /api/templates/[id] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch template', details: message }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/[id] — Delete a custom template.
 * Standard templates (banner, card, inline, image-text) cannot be deleted.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (STANDARD_IDS.includes(id)) {
      return NextResponse.json({ error: 'Standard templates cannot be deleted' }, { status: 403 });
    }

    const db = getDb();
    const existing = await db.select().from(templates).where(eq(templates.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.delete(templates).where(eq(templates.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/templates/[id] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete template', details: message }, { status: 500 });
  }
}
