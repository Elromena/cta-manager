import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ctas, ctaContent, ctaUsage, templates } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { STANDARD_TEMPLATES, renderTemplate } from '@/lib/templates';

// GET /api/cta/[slug] — Get a single CTA (optionally rendered)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const db = getDb();
    const { slug } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    const render = request.nextUrl.searchParams.get('render') === 'true';

    const ctaRows = await db.select().from(ctas).where(eq(ctas.slug, slug));
    const cta = ctaRows[0];
    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Get content for requested locale, fallback to 'en'
    let contentRows = await db
      .select()
      .from(ctaContent)
      .where(and(eq(ctaContent.ctaId, cta.id), eq(ctaContent.locale, locale)));
    let content = contentRows[0];

    if (!content && locale !== 'en') {
      contentRows = await db
        .select()
        .from(ctaContent)
        .where(and(eq(ctaContent.ctaId, cta.id), eq(ctaContent.locale, 'en')));
      content = contentRows[0];
    }

    // Get all content (for admin editing)
    const allContent = await db
      .select()
      .from(ctaContent)
      .where(eq(ctaContent.ctaId, cta.id));

    // Get usage info
    const usage = await db
      .select()
      .from(ctaUsage)
      .where(eq(ctaUsage.ctaSlug, slug));

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
          imageFit: content.imageFit || 'cover',
        });
      } else {
        // Try DB first, fallback to hardcoded defaults
        let tmplHtml = '';
        let tmplCss = '';

        const dbTemplate = await db.select().from(templates).where(eq(templates.id, cta.templateId || 'banner'));
        if (dbTemplate.length > 0) {
          tmplHtml = dbTemplate[0].htmlTemplate;
          tmplCss = dbTemplate[0].css || '';
        } else {
          const fallback = STANDARD_TEMPLATES.find((t) => t.id === cta.templateId);
          if (fallback) {
            tmplHtml = fallback.htmlTemplate;
            tmplCss = fallback.css;
          }
        }

        if (tmplHtml) {
          html = renderTemplate(tmplHtml, {
            heading: content.heading || '',
            body: content.body || '',
            buttonText: content.buttonText || '',
            buttonUrl: content.buttonUrl || '',
            imageUrl: content.imageUrl || '',
            imageFit: content.imageFit || 'cover',
          });
          css = tmplCss;
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
    const db = getDb();
    const { slug } = await params;
    const body = await request.json();
    const { name, scope, vertical, templateType, templateId, customHtml, status, startDate, endDate, content } = body;

    const ctaRows = await db.select().from(ctas).where(eq(ctas.slug, slug));
    const cta = ctaRows[0];
    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Update CTA fields
    await db.update(ctas)
      .set({
        name: name ?? cta.name,
        scope: scope ?? cta.scope,
        vertical: vertical ?? cta.vertical,
        templateType: templateType ?? cta.templateType,
        templateId: templateId ?? cta.templateId,
        customHtml: customHtml ?? cta.customHtml,
        status: status ?? cta.status,
        startDate: startDate !== undefined ? startDate : cta.startDate,
        endDate: endDate !== undefined ? endDate : cta.endDate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ctas.slug, slug));

    // Update locale content
    if (content && Array.isArray(content)) {
      for (const c of content) {
        const existingRows = await db
          .select()
          .from(ctaContent)
          .where(and(eq(ctaContent.ctaId, cta.id), eq(ctaContent.locale, c.locale || 'en')));
        const existingContent = existingRows[0];

        if (existingContent) {
          await db.update(ctaContent)
            .set({
              heading: c.heading ?? existingContent.heading,
              body: c.body ?? existingContent.body,
              buttonText: c.buttonText ?? existingContent.buttonText,
              buttonUrl: c.buttonUrl ?? existingContent.buttonUrl,
              imageUrl: c.imageUrl ?? existingContent.imageUrl,
              imageFit: c.imageFit ?? existingContent.imageFit,
            })
            .where(eq(ctaContent.id, existingContent.id));
        } else {
          await db.insert(ctaContent).values({
            id: nanoid(),
            ctaId: cta.id,
            locale: c.locale || 'en',
            heading: c.heading || '',
            body: c.body || '',
            buttonText: c.buttonText || '',
            buttonUrl: c.buttonUrl || '',
            imageUrl: c.imageUrl || '',
            imageFit: c.imageFit || 'cover',
          });
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
    const db = getDb();
    const { slug } = await params;

    const ctaRows = await db.select().from(ctas).where(eq(ctas.slug, slug));
    const cta = ctaRows[0];
    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    // Check usage
    const usage = await db.select().from(ctaUsage).where(eq(ctaUsage.ctaSlug, slug));

    // Delete content first (cascade), then CTA
    await db.delete(ctaContent).where(eq(ctaContent.ctaId, cta.id));
    await db.delete(ctas).where(eq(ctas.id, cta.id));

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
