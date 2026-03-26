'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LOCALES = ['en', 'ru', 'es', 'ko', 'zh', 'ja', 'tr'];
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish',
  ko: 'Korean', zh: 'Chinese', ja: 'Japanese', tr: 'Turkish',
};

const TEMPLATES = [
  { id: 'banner', name: 'Banner', description: 'Full-width gradient banner with heading, body, and CTA button' },
  { id: 'card', name: 'Card', description: 'Compact card with optional image, heading, body, and button' },
  { id: 'inline', name: 'Inline', description: 'Minimal inline CTA that blends with article text' },
  { id: 'image-text', name: 'Image + Text', description: 'Side-by-side image and text block' },
];

interface ContentByLocale {
  [locale: string]: {
    heading: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
    imageUrl: string;
  };
}

export default function CreateCta() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [scope, setScope] = useState('global');
  const [vertical, setVertical] = useState('');
  const [templateType, setTemplateType] = useState('standard');
  const [templateId, setTemplateId] = useState('banner');
  const [customHtml, setCustomHtml] = useState('');
  const [activeLocale, setActiveLocale] = useState('en');
  const [enabledLocales, setEnabledLocales] = useState<string[]>(['en']);
  const [content, setContent] = useState<ContentByLocale>({
    en: { heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const autoSlug = (val: string) => {
    setName(val);
    if (!slug || slug === autoSlugify(name)) {
      setSlug(autoSlugify(val));
    }
  };

  const autoSlugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const toggleLocale = (locale: string) => {
    if (locale === 'en') return; // EN is always enabled
    if (enabledLocales.includes(locale)) {
      setEnabledLocales(enabledLocales.filter((l) => l !== locale));
      if (activeLocale === locale) setActiveLocale('en');
    } else {
      setEnabledLocales([...enabledLocales, locale]);
      if (!content[locale]) {
        setContent({
          ...content,
          [locale]: { heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '' },
        });
      }
    }
  };

  const updateContent = (locale: string, field: string, value: string) => {
    setContent({
      ...content,
      [locale]: { ...(content[locale] || {}), [field]: value },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const contentArray = enabledLocales.map((locale) => ({
      locale,
      ...content[locale],
    }));

    try {
      const res = await fetch('/api/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          scope,
          vertical: scope === 'vertical' ? vertical : null,
          templateType,
          templateId: templateType === 'standard' ? templateId : null,
          customHtml: templateType === 'custom' ? customHtml : null,
          content: contentArray,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create CTA');
      }

      router.push('/admin/ctas');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentContent = content[activeLocale] || {
    heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create CTA</h1>
          <p>Set up a new call-to-action</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '720px' }}>
        {/* Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>CTA Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => autoSlug(e.target.value)}
              placeholder="e.g. Book a Demo"
              required
            />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input
              className="form-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. book-demo"
              required
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, and hyphens only"
            />
          </div>
        </div>

        {/* Scope */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Scope</label>
            <select className="form-select" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="global">Global (all articles)</option>
              <option value="vertical">Vertical-specific</option>
              <option value="article">Article-specific</option>
            </select>
          </div>
          {scope === 'vertical' && (
            <div className="form-group">
              <label>Vertical</label>
              <select className="form-select" value={vertical} onChange={(e) => setVertical(e.target.value)}>
                <option value="">Select vertical</option>
                <option value="crypto">Crypto</option>
                <option value="igaming">iGaming</option>
                <option value="sportsbook">Sportsbook</option>
                <option value="finance">Finance</option>
                <option value="crypto-gambling">Crypto Gambling</option>
              </select>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="form-group">
          <label>Template Type</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`btn btn-sm ${templateType === 'standard' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTemplateType('standard')}
            >
              Standard Template
            </button>
            <button
              type="button"
              className={`btn btn-sm ${templateType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTemplateType('custom')}
            >
              Custom HTML
            </button>
          </div>

          {templateType === 'standard' ? (
            <div className="template-grid">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className={`template-card ${templateId === t.id ? 'selected' : ''}`}
                  onClick={() => setTemplateId(t.id)}
                >
                  <h4>{t.name}</h4>
                  <p>{t.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="form-group">
              <label>Custom HTML Template</label>
              <textarea
                className="form-textarea"
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder={`<div class="my-cta">\n  <h3>{{heading}}</h3>\n  <p>{{body}}</p>\n  <a href="{{buttonUrl}}">{{buttonText}}</a>\n</div>`}
                style={{ minHeight: '200px', fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Use {'{{heading}}'}, {'{{body}}'}, {'{{buttonText}}'}, {'{{buttonUrl}}'}, {'{{imageUrl}}'} as variables
              </p>
            </div>
          )}
        </div>

        {/* Locale Content */}
        <div className="form-group">
          <label>Content by Locale</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                className={`btn btn-sm ${
                  !enabledLocales.includes(locale)
                    ? 'btn-secondary'
                    : activeLocale === locale
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                onClick={() => {
                  if (enabledLocales.includes(locale)) {
                    setActiveLocale(locale);
                  } else {
                    toggleLocale(locale);
                    setActiveLocale(locale);
                  }
                }}
                style={{
                  opacity: enabledLocales.includes(locale) ? 1 : 0.4,
                }}
              >
                {locale.toUpperCase()}
                {enabledLocales.includes(locale) && locale !== 'en' && (
                  <span
                    onClick={(ev) => { ev.stopPropagation(); toggleLocale(locale); }}
                    style={{ marginLeft: '6px', cursor: 'pointer' }}
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Editing: <strong>{LOCALE_NAMES[activeLocale]}</strong>
            {activeLocale !== 'en' && ' (falls back to English if empty)'}
          </p>

          <div className="form-group">
            <label>Heading</label>
            <input
              className="form-input"
              value={currentContent.heading}
              onChange={(e) => updateContent(activeLocale, 'heading', e.target.value)}
              placeholder="e.g. Start Advertising with Blockchain-Ads"
            />
          </div>
          <div className="form-group">
            <label>Body Text</label>
            <textarea
              className="form-textarea"
              value={currentContent.body}
              onChange={(e) => updateContent(activeLocale, 'body', e.target.value)}
              placeholder="e.g. Reach 9,400+ crypto brands across 82 blockchains..."
              style={{ minHeight: '80px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Button Text</label>
              <input
                className="form-input"
                value={currentContent.buttonText}
                onChange={(e) => updateContent(activeLocale, 'buttonText', e.target.value)}
                placeholder="e.g. Book a Demo"
              />
            </div>
            <div className="form-group">
              <label>Button URL</label>
              <input
                className="form-input"
                value={currentContent.buttonUrl}
                onChange={(e) => updateContent(activeLocale, 'buttonUrl', e.target.value)}
                placeholder="e.g. https://blockchain-ads.com/book-demo"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Image URL (optional)</label>
            <input
              className="form-input"
              value={currentContent.imageUrl}
              onChange={(e) => updateContent(activeLocale, 'imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Embed Code Preview */}
        <div className="form-group">
          <label>Embed Code</label>
          <div
            className="embed-code"
            onClick={() => slug && navigator.clipboard.writeText(`<div data-cta="${slug}"></div>`)}
          >
            {slug
              ? `<div data-cta="${slug}"></div>`
              : 'Enter a slug to generate embed code'}
            {slug && <span className="copy-hint">Click to copy</span>}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create CTA'}
          </button>
          <a href="/admin/ctas" className="btn btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  );
}
