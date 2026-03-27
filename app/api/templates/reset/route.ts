import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { templates } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { STANDARD_TEMPLATES } from '@/lib/templates';

/**
 * POST /api/templates/reset?id=xxx — Reset a template to its hardcoded default.
 */
export async function POST(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const std = STANDARD_TEMPLATES.find((t) => t.id === id);
    if (!std) {
      return NextResponse.json({ error: 'No default found for this template' }, { status: 404 });
    }

    const db = getDb();
    await db.update(templates).set({
      htmlTemplate: std.htmlTemplate,
      css: std.css,
    }).where(eq(templates.id, id));

    return NextResponse.json({ htmlTemplate: std.htmlTemplate, css: std.css });
  } catch (error) {
    console.error('POST /api/templates/reset error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to reset template', details: message }, { status: 500 });
  }
}
