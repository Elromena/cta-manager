import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ctas, ctaContent, ctaUsage, templates } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { STANDARD_TEMPLATES, renderTemplate } from '@/lib/templates';

/**
 * POST /api/cta-batch
 * Batch fetch and render multiple CTAs for the client script.
 * Body: { slugs: string[], locale: string, pageUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { slugs, locale = 'en', pageUrl } = body;

    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: 'slugs array is required' }, { status: 400 });
    }

    const results: Record<string, { html: string; css: string }> = {};
    const allCss = new Set<string>();

    for (const slug of slugs) {
      const ctaRows = await db.select().from(ctas).where(eq(ctas.slug, slug));
      const cta = ctaRows[0];
      if (!cta || cta.status !== 'active') continue;

      // Check scheduling window
      const now = new Date().toISOString();
      if (cta.startDate && now < cta.startDate) continue;
      if (cta.endDate && now > cta.endDate) continue;

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

      if (!content) continue;

      const data = {
        heading: content.heading || '',
        body: content.body || '',
        buttonText: content.buttonText || '',
        buttonUrl: content.buttonUrl || '',
        imageUrl: content.imageUrl || '',
        imageFit: content.imageFit || 'cover',
      };

      let html = '';
      let css = '';

      if (cta.templateType === 'custom' && cta.customHtml) {
        html = renderTemplate(cta.customHtml, data);
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
          html = renderTemplate(tmplHtml, data);
          css = tmplCss;
          allCss.add(css);
        }
      }

      results[slug] = { html, css: '' }; // CSS goes in combined stylesheet

      // Log usage (upsert)
      if (pageUrl) {
        const existingRows = await db
          .select()
          .from(ctaUsage)
          .where(and(eq(ctaUsage.ctaSlug, slug), eq(ctaUsage.pageUrl, pageUrl)));
        const existingUsage = existingRows[0];

        if (existingUsage) {
          await db.update(ctaUsage)
            .set({ lastSeenAt: new Date().toISOString(), locale })
            .where(eq(ctaUsage.id, existingUsage.id));
        } else {
          await db.insert(ctaUsage).values({
            id: nanoid(),
            ctaSlug: slug,
            pageUrl,
            locale,
            lastSeenAt: new Date().toISOString(),
          });
        }
      }
    }

    // Combine all CSS into one stylesheet
    const combinedCss = Array.from(allCss).join('\n');

    return NextResponse.json({
      ctas: results,
      css: combinedCss,
    });
  } catch (error) {
    console.error('POST /api/cta-batch error:', error);
    return NextResponse.json({ error: 'Failed to batch fetch CTAs' }, { status: 500 });
  }
}
