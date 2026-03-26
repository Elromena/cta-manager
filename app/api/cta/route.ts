import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ctas, ctaContent } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET /api/cta — List all CTAs with their content
export async function GET() {
  try {
    const allCtas = db.select().from(ctas).all();

    const ctasWithContent = allCtas.map((cta) => {
      const content = db
        .select()
        .from(ctaContent)
        .where(eq(ctaContent.ctaId, cta.id))
        .all();
      return { ...cta, content };
    });

    return NextResponse.json({ ctas: ctasWithContent });
  } catch (error) {
    console.error('GET /api/cta error:', error);
    return NextResponse.json({ error: 'Failed to fetch CTAs' }, { status: 500 });
  }
}

// POST /api/cta — Create a new CTA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, scope, vertical, templateType, templateId, customHtml, content } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = db.select().from(ctas).where(eq(ctas.slug, slug)).get();
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const ctaId = nanoid();

    // Insert CTA
    db.insert(ctas).values({
      id: ctaId,
      slug,
      name,
      scope: scope || 'global',
      vertical: vertical || null,
      templateType: templateType || 'standard',
      templateId: templateId || 'banner',
      customHtml: customHtml || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Insert locale content
    if (content && Array.isArray(content)) {
      for (const c of content) {
        db.insert(ctaContent).values({
          id: nanoid(),
          ctaId,
          locale: c.locale || 'en',
          heading: c.heading || '',
          body: c.body || '',
          buttonText: c.buttonText || '',
          buttonUrl: c.buttonUrl || '',
          imageUrl: c.imageUrl || '',
        }).run();
      }
    }

    return NextResponse.json({ id: ctaId, slug }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cta error:', error);
    return NextResponse.json({ error: 'Failed to create CTA' }, { status: 500 });
  }
}
