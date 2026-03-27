'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOCALES = ['en', 'ru', 'es', 'ko', 'zh', 'ja', 'tr'];
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish',
  ko: 'Korean', zh: 'Chinese', ja: 'Japanese', tr: 'Turkish',
};

interface ContentByLocale {
  [locale: string]: {
    heading: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
    imageUrl: string;
    imageFit: string;
  };
}

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  htmlTemplate?: string;
  isCustom?: boolean;
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
    en: { heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover' },
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Scheduling state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dynamic template picker state
  const [availableTemplates, setAvailableTemplates] = useState<TemplateItem[]>([]);
  const [templateCategory, setTemplateCategory] = useState<'all' | 'standard' | 'custom'>('all');

  // Save as Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const fetchTemplates = () => {
    fetch('/cta-admin/api/templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableTemplates(data);
        } else if (data.templates && Array.isArray(data.templates)) {
          setAvailableTemplates(data.templates);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = availableTemplates.filter((t) => {
    if (templateCategory === 'all') return true;
    if (templateCategory === 'custom') return t.isCustom === true;
    if (templateCategory === 'standard') return !t.isCustom;
    return true;
  });

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
          [locale]: { heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover' },
        });
      }
    }
  };

  const handleImageUpload = async (file: File, locale: string) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/cta-admin/api/media/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      updateContent(locale, 'imageUrl', data.url);
    } catch {
      setToast('Image upload failed');
      setTimeout(() => setToast(''), 3000);
    }
    setUploading(false);
  };

  const updateContent = (locale: string, field: string, value: string) => {
    setContent({
      ...content,
      [locale]: { ...(content[locale] || {}), [field]: value },
    });
  };

  const handleSaveAsTemplate = async () => {
    try {
      const res = await fetch('/cta-admin/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName, htmlTemplate: customHtml, css: '' }),
      });
      if (!res.ok) throw new Error('Failed');
      setShowSaveTemplate(false);
      setTemplateName('');
      fetchTemplates();
      setToast('Template saved!');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to save template');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const contentArray = enabledLocales.map((locale) => ({
      locale,
      ...content[locale],
      imageFit: content[locale]?.imageFit || 'cover',
    }));

    try {
      const res = await fetch('/cta-admin/api/cta', {
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
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
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
    heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create CTA</h1>
          <p>Set up a new call-to-action</p>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: 'var(--accent)',
          color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

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

        {/* Scheduling */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Start Date (optional)</label>
            <input type="datetime-local" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date (optional)</label>
            <input type="datetime-local" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
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
            <>
              {/* Category filter buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {(['all', 'standard', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${templateCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTemplateCategory(cat)}
                  >
                    {cat === 'all' ? 'All' : cat === 'standard' ? 'Standard' : 'Custom'}
                  </button>
                ))}
              </div>
              <div className="template-grid">
                {filteredTemplates.map((t) => (
                  <div
                    key={t.id}
                    className={`template-card ${templateId === t.id ? 'selected' : ''}`}
                    onClick={() => setTemplateId(t.id)}
                  >
                    <h4>
                      {t.name}
                      {t.isCustom && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--warning, #f59e0b)',
                          color: '#fff',
                          fontWeight: 500,
                        }}>
                          Custom
                        </span>
                      )}
                    </h4>
                    <p>{t.description || t.htmlTemplate?.slice(0, 60) || ''}</p>
                  </div>
                ))}
                {filteredTemplates.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', gridColumn: '1 / -1' }}>
                    No templates found in this category.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
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
              {/* Save as Template */}
              {!showSaveTemplate ? (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowSaveTemplate(true)} style={{ marginTop: '8px' }}>
                  Save as Template
                </button>
              ) : (
                <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: '8px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Template Name</label>
                    <input className="form-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="My Custom Template" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveAsTemplate}>Save Template</button>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowSaveTemplate(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </>
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
            <label>Image (optional)</label>
            {currentContent.imageUrl && (
              <div style={{ marginBottom: '8px' }}>
                <img
                  src={currentContent.imageUrl}
                  alt="Preview"
                  style={{
                    height: '120px',
                    borderRadius: '8px',
                    objectFit: (currentContent.imageFit as React.CSSProperties['objectFit']) || 'cover',
                    display: 'block',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="file"
                accept="image/*"
                id={`image-upload-${activeLocale}`}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, activeLocale);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => document.getElementById(`image-upload-${activeLocale}`)?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
              {currentContent.imageUrl && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => updateContent(activeLocale, 'imageUrl', '')}
                  style={{ color: 'var(--danger)' }}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Or paste URL</label>
              <input
                className="form-input"
                value={currentContent.imageUrl}
                onChange={(e) => updateContent(activeLocale, 'imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Image Fit</label>
              <select
                className="form-select"
                value={currentContent.imageFit || 'cover'}
                onChange={(e) => updateContent(activeLocale, 'imageFit', e.target.value)}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
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
          <Link href="/admin/ctas" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
