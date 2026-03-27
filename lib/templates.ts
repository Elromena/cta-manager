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
    description: 'Full-width dark navy banner with orange CTA button. No image needed.',
    htmlTemplate: `
<div class="bca-cta bca-cta--banner">
  <div class="bca-cta__inner">
    <div class="bca-cta__heading">{{heading}}</div>
    <p class="bca-cta__body">{{body}}</p>
    <a href="{{buttonUrl}}" class="bca-cta__btn">{{buttonText}}</a>
  </div>
</div>`,
    css: `
.bca-cta--banner {
  background: linear-gradient(135deg, #1a2052 0%, #2a3270 50%, #1a2052 100%);
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
  top: -30%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(247,92,3,0.15) 0%, transparent 70%);
  border-radius: 50%;
}
.bca-cta--banner::after {
  content: '';
  position: absolute;
  bottom: -20%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(247,92,3,0.08) 0%, transparent 70%);
  border-radius: 50%;
}
.bca-cta--banner .bca-cta__inner {
  position: relative;
  z-index: 1;
  max-width: 560px;
}
.bca-cta--banner .bca-cta__heading {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 12px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.bca-cta--banner .bca-cta__body {
  font-size: 15px;
  margin: 0 0 24px;
  opacity: 0.85;
  line-height: 1.65;
}
.bca-cta--banner .bca-cta__btn {
  display: inline-block;
  background: #F75C03;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 13px 30px;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.bca-cta--banner .bca-cta__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(247,92,3,0.3);
}`,
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Clean card with image on top. Recommended image: 800 x 400px.',
    htmlTemplate: `
<div class="bca-cta bca-cta--card">
  {{#imageUrl}}<img src="{{imageUrl}}" alt="{{heading}}" class="bca-cta__image" style="object-fit: {{imageFit}}" />{{/imageUrl}}
  <div class="bca-cta__content">
    <div class="bca-cta__heading">{{heading}}</div>
    <p class="bca-cta__body">{{body}}</p>
    <a href="{{buttonUrl}}" class="bca-cta__btn">{{buttonText}}</a>
  </div>
</div>`,
    css: `
.bca-cta--card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  margin: 40px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: box-shadow 0.3s;
}
.bca-cta--card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
.bca-cta--card .bca-cta__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}
.bca-cta--card .bca-cta__content {
  padding: 28px 32px;
}
.bca-cta--card .bca-cta__heading {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1a2052;
  line-height: 1.3;
}
.bca-cta--card .bca-cta__body {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px;
  line-height: 1.65;
}
.bca-cta--card .bca-cta__btn {
  display: inline-block;
  background: #F75C03;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 26px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
}
.bca-cta--card .bca-cta__btn:hover {
  background: #e05400;
  transform: translateY(-1px);
}`,
  },
  {
    id: 'inline',
    name: 'Inline',
    description: 'Minimal inline CTA that blends with article text. No image needed.',
    htmlTemplate: `
<div class="bca-cta bca-cta--inline">
  <span class="bca-cta__body">{{body}}</span>
  <a href="{{buttonUrl}}" class="bca-cta__link">{{buttonText}} &#8594;</a>
</div>`,
    css: `
.bca-cta--inline {
  background: #fafbfc;
  border-left: 3px solid #F75C03;
  padding: 18px 24px;
  margin: 32px 0;
  border-radius: 0 10px 10px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.bca-cta--inline .bca-cta__body {
  font-size: 14px;
  color: #374151;
  flex: 1;
  min-width: 200px;
  line-height: 1.5;
}
.bca-cta--inline .bca-cta__link {
  color: #F75C03;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s;
  border-bottom: 1px solid transparent;
}
.bca-cta--inline .bca-cta__link:hover {
  border-bottom-color: #F75C03;
}`,
  },
  {
    id: 'image-text',
    name: 'Image + Text',
    description: 'Side-by-side layout with image left. Recommended image: 600 x 400px.',
    htmlTemplate: `
<div class="bca-cta bca-cta--image-text">
  {{#imageUrl}}<div class="bca-cta__media">
    <img src="{{imageUrl}}" alt="{{heading}}" class="bca-cta__image" style="object-fit: {{imageFit}}" />
  </div>{{/imageUrl}}
  <div class="bca-cta__content">
    <div class="bca-cta__heading">{{heading}}</div>
    <p class="bca-cta__body">{{body}}</p>
    <a href="{{buttonUrl}}" class="bca-cta__btn">{{buttonText}}</a>
  </div>
</div>`,
    css: `
.bca-cta--image-text {
  display: flex;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  margin: 40px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.bca-cta--image-text .bca-cta__media {
  flex: 0 0 40%;
  min-height: 220px;
  background: #f1f5f9;
}
.bca-cta--image-text .bca-cta__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.bca-cta--image-text .bca-cta__content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.bca-cta--image-text .bca-cta__heading {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1a2052;
  line-height: 1.3;
}
.bca-cta--image-text .bca-cta__body {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px;
  line-height: 1.65;
}
.bca-cta--image-text .bca-cta__btn {
  display: inline-block;
  background: #F75C03;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 26px;
  border-radius: 8px;
  text-decoration: none;
  width: fit-content;
  transition: background 0.2s, transform 0.2s;
}
.bca-cta--image-text .bca-cta__btn:hover {
  background: #e05400;
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
