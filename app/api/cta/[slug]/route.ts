import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ctas, ctaContent, ctaUsage } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { STANDARD_TEMPLATES, renderTemplate } from '@/lib/templates';

// GET /api/cta/[slug] — Get a single CTA (optionally rendered)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    const render = request.nextUrl.searchParams.get('render') === 'true';

    const cta = db.select().from(ctas).where(eq(ctas.slug, slug)).get();
    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Get content for requested locale, fallback to 'en'
    let content = db
      .select()
      .from(ctaContent)
      .where(and(eq(ctaContent.ctaId, cta.id), eq(ctaContent.locale, locale)))
      .get();

    if (!content && locale !== 'en') {
      content = db
        .select()
        .from(ctaContent)
        .where(and(eq(ctaContent.ctaId, cta.id), eq(ctaContent.locale, 'en')))
        .get();
    }

    // Get all content (for admin editing)
    const allContent = db
      .select()
      .from(ctaContent)
      .where(eq(ctaContent.ctaId, cta.id))
      .all();

    // Get usage info
    const usage = db
      .select()
      .from(ctaUsage)
      .where(eq(ctaUsage.ctaSlug, slug))
      .all();

    if (render && content) {
      // Render the CTA HTML
      let html = '';
      let css = '';

      if (cta.templateType === 'custom' && cta.customHtml) {
        html = renderTemplate(cta.customHtml, {
          heading: content.heading || '',
          body: content.body || '',
          buttonText: content.buttonText || '',
          buttonUrl: content.buttonUrl || '',
          imageUrl: content.imageUrl || '',
        });
      } else {
        const template = STANDARD_TEMPLATES.find((t) => t.id === cta.templateId);
        if (template) {
          html = renderTemplate(template.htmlTemplate, {
            heading: content.heading || '',
            body: content.body || '',
            buttonText: content.buttonText || '',
            buttonUrl: content.buttonUrl || '',
            imageUrl: content.imageUrl || '',
          });
          css = template.css;
        }
      }

      return NextResponse.json({ html, css, slug: cta.slug });
    }

    return NextResponse.json({ ...cta, content: allContent, usage });
  } catch (error) {
    console.error(`GET /api/cta/[slug] error:`, error);
    return NextResponse.json({ error: 'Failed to fetch CTA' }, { status: 500 });
  }
}

// PUT /api/cta/[slug] — Update a CTA
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, scope, vertical, templateType, templateId, customHtml, status, content } = body;

    const cta = db.select().from(ctas).where(eq(ctas.slug, slug)).get();
    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Update CTA fields
    db.update(ctas)
      .set({
        name: name ?? cta.name,
        scope: scope ?? cta.scope,
        vertical: vertical ?? cta.vertical,
        templateType: templateType ?? cta.templateType,
        templateId: templateId ?? cta.templateId,
        customHtml: customHtml ?? cta.customHtml,
        status: status ?? cta.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ctas.slug, slug))
      .run();

    // Update locale content
    if (content && Array.isArray(content)) {
      for (const c of content) {
        const existingContent = db
          .select()
          .from(ctaContent)
          .where(and(eq(ctaContent.ctaId, cta.id), eq(ctaContent.locale, c.locale || 'en')))
          .get();

        if (existingContent) {
          db.update(ctaContent)
            .set({
              heading: c.heading ?? existingContent.heading,
              body: c.body ?? existingContent.body,
              buttonText: c.buttonText ?? existingContent.buttonText,
              buttonUrl: c.buttonUrl ?? existingContent.buttonUrl,
              imageUrl: c.imageUrl ?? existingContent.imageUrl,
            })
            .where(eq(ctaContent.id, existingContent.id))
            .run();
        } else {
          db.insert(ctaContent).values({
            id: nanoid(),
            ctaId: cta.id,
            locale: c.locale || 'en',
            heading: c.heading || '',
            body: c.body || '',
            buttonText: c.buttonText || '',
            buttonUrl: c.buttonUrl || '',
            imageUrl: c.imageUrl || '',
          }).run();
        }
      }
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error(`PUT /api/cta/[slug] error:`, error);
    return NextResponse.json({ error: 'Failed to update CTA' }, { status: 500 });
  }
}

// DELETE /api/cta/[slug] — Delete a CTA
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const cta = db.select().from(ctas).where(eq(ctas.slug, slug)).get();
    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Check usage
    const usage = db.select().from(ctaUsage).where(eq(ctaUsage.ctaSlug, slug)).all();

    // Delete content first (cascade), then CTA
    db.delete(ctaContent).where(eq(ctaContent.ctaId, cta.id)).run();
    db.delete(ctas).where(eq(ctas.id, cta.id)).run();

    return NextResponse.json({
      success: true,
      slug,
      articlesAffected: usage.length,
    });
  } catch (error) {
    console.error(`DELETE /api/cta/[slug] error:`, error);
    return NextResponse.json({ error: 'Failed to delete CTA' }, { status: 500 });
  }
}
