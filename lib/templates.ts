/**
 * Standard CTA templates with Mustache-style variables.
 * Variables: {{heading}}, {{body}}, {{buttonText}}, {{buttonUrl}}, {{imageUrl}}
 */

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  htmlTemplate: string;
  css: string;
}

export const STANDARD_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'banner',
    name: 'Banner',
    description: 'Full-width gradient banner with heading, body, and CTA button',
    htmlTemplate: `
<div class="bca-cta bca-cta--banner">
  <div class="bca-cta__inner">
    <div class="bca-cta__content">
      <h3 class="bca-cta__heading">{{heading}}</h3>
      <p class="bca-cta__body">{{body}}</p>
      <a href="{{buttonUrl}}" class="bca-cta__btn">{{buttonText}}</a>
    </div>
  </div>
</div>`,
    css: `
.bca-cta--banner {
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
  border-radius: 16px;
  padding: 48px 40px;
  margin: 40px 0;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.bca-cta--banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}
.bca-cta--banner .bca-cta__inner {
  position: relative;
  z-index: 1;
  max-width: 600px;
}
.bca-cta--banner .bca-cta__heading {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  line-height: 1.2;
}
.bca-cta--banner .bca-cta__body {
  font-size: 16px;
  margin: 0 0 24px;
  opacity: 0.9;
  line-height: 1.6;
}
.bca-cta--banner .bca-cta__btn {
  display: inline-block;
  background: #fff;
  color: #6366f1;
  font-weight: 600;
  font-size: 15px;
  padding: 14px 32px;
  border-radius: 10px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.bca-cta--banner .bca-cta__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}`,
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Compact card with optional image, heading, body, and button',
    htmlTemplate: `
<div class="bca-cta bca-cta--card">
  {{#imageUrl}}<img src="{{imageUrl}}" alt="{{heading}}" class="bca-cta__image" style="object-fit: {{imageFit}}" />{{/imageUrl}}
  <div class="bca-cta__content">
    <h3 class="bca-cta__heading">{{heading}}</h3>
    <p class="bca-cta__body">{{body}}</p>
    <a href="{{buttonUrl}}" class="bca-cta__btn">{{buttonText}}</a>
  </div>
</div>`,
    css: `
.bca-cta--card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  margin: 40px 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: box-shadow 0.3s;
}
.bca-cta--card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
.bca-cta--card .bca-cta__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.bca-cta--card .bca-cta__content {
  padding: 28px 32px;
}
.bca-cta--card .bca-cta__heading {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #111827;
}
.bca-cta--card .bca-cta__body {
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 20px;
  line-height: 1.6;
}
.bca-cta--card .bca-cta__btn {
  display: inline-block;
  background: #6366f1;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
}
.bca-cta--card .bca-cta__btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}`,
  },
  {
    id: 'inline',
    name: 'Inline',
    description: 'Minimal inline CTA that blends with article text',
    htmlTemplate: `
<div class="bca-cta bca-cta--inline">
  <span class="bca-cta__body">{{body}}</span>
  <a href="{{buttonUrl}}" class="bca-cta__link">{{buttonText}} →</a>
</div>`,
    css: `
.bca-cta--inline {
  background: #f8fafc;
  border-left: 4px solid #6366f1;
  padding: 20px 24px;
  margin: 32px 0;
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.bca-cta--inline .bca-cta__body {
  font-size: 15px;
  color: #374151;
  flex: 1;
  min-width: 200px;
}
.bca-cta--inline .bca-cta__link {
  color: #6366f1;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s;
}
.bca-cta--inline .bca-cta__link:hover {
  color: #4f46e5;
}`,
  },
  {
    id: 'image-text',
    name: 'Image + Text',
    description: 'Side-by-side image and text block for richer CTAs',
    htmlTemplate: `
<div class="bca-cta bca-cta--image-text">
  {{#imageUrl}}<div class="bca-cta__media">
    <img src="{{imageUrl}}" alt="{{heading}}" class="bca-cta__image" style="object-fit: {{imageFit}}" />
  </div>{{/imageUrl}}
  <div class="bca-cta__content">
    <h3 class="bca-cta__heading">{{heading}}</h3>
    <p class="bca-cta__body">{{body}}</p>
    <a href="{{buttonUrl}}" class="bca-cta__btn">{{buttonText}}</a>
  </div>
</div>`,
    css: `
.bca-cta--image-text {
  display: flex;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  margin: 40px 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.bca-cta--image-text .bca-cta__media {
  flex: 0 0 40%;
  min-height: 200px;
}
.bca-cta--image-text .bca-cta__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bca-cta--image-text .bca-cta__content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.bca-cta--image-text .bca-cta__heading {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #111827;
}
.bca-cta--image-text .bca-cta__body {
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 20px;
  line-height: 1.6;
}
.bca-cta--image-text .bca-cta__btn {
  display: inline-block;
  background: #6366f1;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 10px;
  text-decoration: none;
  width: fit-content;
  transition: background 0.2s, transform 0.2s;
}
.bca-cta--image-text .bca-cta__btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}
@media (max-width: 640px) {
  .bca-cta--image-text {
    flex-direction: column;
  }
  .bca-cta--image-text .bca-cta__media {
    flex: none;
    height: 180px;
  }
}`,
  },
];

/**
 * Renders a template with Mustache-style variables.
 * Supports: {{var}}, {{#var}}...{{/var}} (conditional sections)
 */
export function renderTemplate(template: string, data: Record<string, string>): string {
  let result = template;

  // Handle conditional sections: {{#var}}content{{/var}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_: string, key: string, content: string) => {
    return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => data[k] || '') : '';
  });

  // Handle simple variable replacement: {{var}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || '');

  return result;
}
