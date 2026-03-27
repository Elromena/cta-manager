import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { templates } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { STANDARD_TEMPLATES } from '@/lib/templates';
import { nanoid } from 'nanoid';

const STANDARD_IDS = STANDARD_TEMPLATES.map((t) => t.id);

/**
 * GET /api/templates — List all templates.
 * Auto-seeds the DB with standard templates on first call.
 */
export async function GET() {
  try {
    const db = getDb();
    let rows = await db.select().from(templates);

    // Seed defaults if no standard templates exist
    const hasStandard = rows.some((r) => STANDARD_IDS.includes(r.id));
    if (!hasStandard) {
      for (const t of STANDARD_TEMPLATES) {
        await db.insert(templates).values({
          id: t.id,
          name: t.name,
          htmlTemplate: t.htmlTemplate,
          css: t.css,
          previewImage: null,
          category: 'standard',
        });
      }
      rows = await db.select().from(templates);
    }

    // Enrich with description and ensure category
    const enriched = rows.map((row) => {
      const std = STANDARD_TEMPLATES.find((s) => s.id === row.id);
      return {
        ...row,
        description: std?.description || (row.category === 'custom' ? 'Custom template' : ''),
        category: STANDARD_IDS.includes(row.id) ? 'standard' : (row.category || 'custom'),
      };
    });

    return NextResponse.json({ templates: enriched });
  } catch (error) {
    console.error('GET /api/templates error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch templates', details: message }, { status: 500 });
  }
}

/**
 * POST /api/templates — Create a custom template.
 * Body: { name, htmlTemplate, css? }
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, htmlTemplate, css } = body;

    if (!name || !htmlTemplate) {
      return NextResponse.json({ error: 'Name and HTML template are required' }, { status: 400 });
    }

    const id = nanoid();
    await db.insert(templates).values({
      id,
      name,
      htmlTemplate,
      css: css || '',
      previewImage: null,
      category: 'custom',
    });

    return NextResponse.json({ id, name }, { status: 201 });
  } catch (error) {
    console.error('POST /api/templates error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create template', details: message }, { status: 500 });
  }
}

/**
 * PUT /api/templates — Update a template's HTML and/or CSS.
 * Body: { id, htmlTemplate?, css? }
 */
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, htmlTemplate, css } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const existing = await db.select().from(templates).where(eq(templates.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const updates: Record<string, string> = {};
    if (htmlTemplate !== undefined) updates.htmlTemplate = htmlTemplate;
    if (css !== undefined) updates.css = css;

    if (Object.keys(updates).length > 0) {
      await db.update(templates).set(updates).where(eq(templates.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/templates error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update template', details: message }, { status: 500 });
  }
}
