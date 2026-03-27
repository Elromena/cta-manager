import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ctas, ctaContent, ctaUsage, templates } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { STANDARD_TEMPLATES, renderTemplate } from '@/lib/templates';

/**
 * POST /api/cta-batch
 * Batch fetch and render multiple CTAs for the client script.
 * Body: { items: [{slug, variant}], locale: string, pageUrl: string }
 * Backwards compatible: also accepts { slugs: string[] } (variant defaults to 'default')
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { locale = 'en', pageUrl } = body;

    // Support both old format (slugs[]) and new format (items[{slug, variant}])
    let items: Array<{ slug: string; variant: string }> = [];
    if (body.items && Array.isArray(body.items)) {
      items = body.items.map((item: any) => ({
        slug: item.slug,
        variant: item.variant || 'default',
      }));
    } else if (body.slugs && Array.isArray(body.slugs)) {
      items = body.slugs.map((slug: string) => ({ slug, variant: 'default' }));
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'items or slugs array is required' }, { status: 400 });
    }

    const results: Record<string, { html: string; css: string }> = {};
    const allCss = new Set<string>();

    for (const item of items) {
      const { slug, variant } = item;
      const resultKey = slug + '::' + variant;

      const ctaRows = await db.select().from(ctas).where(eq(ctas.slug, slug));
      const cta = ctaRows[0];
      if (!cta || cta.status !== 'active') continue;

      // Check scheduling window
      const now = new Date().toISOString();
      if (cta.startDate && now < cta.startDate) continue;
      if (cta.endDate && now > cta.endDate) continue;

      // Get content for requested locale + variant, with fallbacks:
      // 1. Try exact locale + variant
      // 2. Try locale + 'default' variant
      // 3. Try 'en' + variant
      // 4. Try 'en' + 'default'
      let content = null;

      const tryContent = async (loc: string, v: string) => {
        const rows = await db
          .select()
          .from(ctaContent)
          .where(and(
            eq(ctaContent.ctaId, cta.id),
            eq(ctaContent.locale, loc),
            eq(ctaContent.variant, v)
          ));
        return rows[0] || null;
      };

      content = await tryContent(locale, variant);
      if (!content && variant !== 'default') content = await tryContent(locale, 'default');
      if (!content && locale !== 'en') content = await tryContent('en', variant);
      if (!content && (locale !== 'en' || variant !== 'default')) content = await tryContent('en', 'default');

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

      results[resultKey] = { html, css: '' };

      // Log usage
      if (pageUrl) {
        const existingRows = await db
          .select()
          .from(ctaUsage)
          .where(and(eq(ctaUsage.ctaSlug, slug), eq(ctaUsage.pageUrl, pageUrl)));
        const existingUsage = existingRows[0];

        if (existingUsage) {
          await db.update(ctaUsage)
            .set({ lastSeenAt: new Date().toISOString(), locale, variant })
            .where(eq(ctaUsage.id, existingUsage.id));
        } else {
          await db.insert(ctaUsage).values({
            id: nanoid(),
            ctaSlug: slug,
            pageUrl,
            locale,
            variant,
            lastSeenAt: new Date().toISOString(),
          });
        }
      }
    }

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
