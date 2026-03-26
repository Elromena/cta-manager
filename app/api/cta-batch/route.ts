import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ctas, ctaContent, ctaUsage } from '@/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { STANDARD_TEMPLATES, renderTemplate } from '@/lib/templates';

/**
 * POST /api/cta-batch
 * Batch fetch and render multiple CTAs for the client script.
 * Body: { slugs: string[], locale: string, pageUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slugs, locale = 'en', pageUrl } = body;

    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: 'slugs array is required' }, { status: 400 });
    }

    const results: Record<string, { html: string; css: string }> = {};
    const allCss = new Set<string>();

    for (const slug of slugs) {
      const cta = db.select().from(ctas).where(eq(ctas.slug, slug)).get();
      if (!cta || cta.status !== 'active') continue;

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

      if (!content) continue;

      const data = {
        heading: content.heading || '',
        body: content.body || '',
        buttonText: content.buttonText || '',
        buttonUrl: content.buttonUrl || '',
        imageUrl: content.imageUrl || '',
      };

      let html = '';
      let css = '';

      if (cta.templateType === 'custom' && cta.customHtml) {
        html = renderTemplate(cta.customHtml, data);
      } else {
        const template = STANDARD_TEMPLATES.find((t) => t.id === cta.templateId);
        if (template) {
          html = renderTemplate(template.htmlTemplate, data);
          css = template.css;
          allCss.add(css);
        }
      }

      results[slug] = { html, css: '' }; // CSS goes in combined stylesheet

      // Log usage (upsert)
      if (pageUrl) {
        const existingUsage = db
          .select()
          .from(ctaUsage)
          .where(and(eq(ctaUsage.ctaSlug, slug), eq(ctaUsage.pageUrl, pageUrl)))
          .get();

        if (existingUsage) {
          db.update(ctaUsage)
            .set({ lastSeenAt: new Date().toISOString(), locale })
            .where(eq(ctaUsage.id, existingUsage.id))
            .run();
        } else {
          db.insert(ctaUsage).values({
            id: nanoid(),
            ctaSlug: slug,
            pageUrl,
            locale,
            lastSeenAt: new Date().toISOString(),
          }).run();
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
