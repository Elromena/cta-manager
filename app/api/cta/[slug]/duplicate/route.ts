import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ctas, ctaContent } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * POST /api/cta/[slug]/duplicate — Duplicate a CTA with all its content.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const db = getDb();
    const { slug } = await params;

    // Find original
    const ctaRows = await db.select().from(ctas).where(eq(ctas.slug, slug));
    const original = ctaRows[0];
    if (!original) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Generate unique slug
    let newSlug = `${slug}-copy`;
    let attempt = 1;
    while (true) {
      const existing = await db.select().from(ctas).where(eq(ctas.slug, newSlug));
      if (existing.length === 0) break;
      attempt++;
      newSlug = `${slug}-copy-${attempt}`;
    }

    const newId = nanoid();
    const now = new Date().toISOString();

    // Insert copy
    await db.insert(ctas).values({
      id: newId,
      slug: newSlug,
      name: `${original.name} (Copy)`,
      scope: original.scope,
      vertical: original.vertical,
      templateType: original.templateType,
      templateId: original.templateId,
      customHtml: original.customHtml,
      status: 'inactive',
      startDate: null,
      endDate: null,
      createdAt: now,
      updatedAt: now,
    });

    // Copy all content rows
    const contentRows = await db.select().from(ctaContent).where(eq(ctaContent.ctaId, original.id));
    for (const c of contentRows) {
      await db.insert(ctaContent).values({
        id: nanoid(),
        ctaId: newId,
        locale: c.locale,
        heading: c.heading,
        body: c.body,
        buttonText: c.buttonText,
        buttonUrl: c.buttonUrl,
        imageUrl: c.imageUrl,
      });
    }

    return NextResponse.json({ id: newId, slug: newSlug }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cta/[slug]/duplicate error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to duplicate CTA', details: message }, { status: 500 });
  }
}
