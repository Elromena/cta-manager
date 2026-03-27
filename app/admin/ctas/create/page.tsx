'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOCALES = ['en', 'ru', 'es', 'ko', 'zh', 'ja', 'tr'];
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish',
  ko: 'Korean', zh: 'Chinese', ja: 'Japanese', tr: 'Turkish',
};

interface ContentItem {
  locale: string;
  variant: string;
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  imageFit: string;
}

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  htmlTemplate?: string;
  css?: string;
  category?: string;
}

export default function CreateCta() {
  const router = useRouter();

  // Basic info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('active');
  const [scope, setScope] = useState('global');
  const [vertical, setVertical] = useState('');

  // Template
  const [templateType, setTemplateType] = useState('standard');
  const [templateId, setTemplateId] = useState('banner');
  const [customHtml, setCustomHtml] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<TemplateItem[]>([]);

  // Save as Template
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Scheduling
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Variants
  const [activeVariant, setActiveVariant] = useState('default');
  const [variants, setVariants] = useState<string[]>(['default']);
  const [newVariantName, setNewVariantName] = useState('');
  const [showAddVariant, setShowAddVariant] = useState(false);

  // Content keyed by "variant::locale"
  const [activeLocale, setActiveLocale] = useState('en');
  const [content, setContent] = useState<Record<string, ContentItem>>({
    'default::en': { locale: 'en', variant: 'default', heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover' },
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const contentKey = activeVariant + '::' + activeLocale;

  const fetchTemplates = () => {
    fetch('/cta-admin/api/templates')
      .then((r) => r.json())
      .then((data) => setAvailableTemplates(data.templates || []))
      .catch(() => {});
  };

  useEffect(() => { fetchTemplates(); }, []);

  // Auto-slug from name
  const autoSlugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const autoSlug = (val: string) => {
    setName(val);
    if (!slug || slug === autoSlugify(name)) {
      setSlug(autoSlugify(val));
    }
  };

  // Content helpers
  const currentContent = content[contentKey] || {
    locale: activeLocale, variant: activeVariant, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover',
  };

  const enabledLocales = Object.keys(content)
    .filter((k) => k.startsWith(activeVariant + '::'))
    .map((k) => k.split('::')[1]);

  const updateContent = (locale: string, field: string, value: string) => {
    const key = activeVariant + '::' + locale;
    setContent({
      ...content,
      [key]: {
        ...(content[key] || { locale, variant: activeVariant, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover' }),
        [field]: value,
      },
    });
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
      showToast('Image upload failed');
    }
    setUploading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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
      showToast('Template saved!');
    } catch {
      showToast('Failed to save template');
    }
  };

  // Live preview
  function renderPreview(): { html: string; css: string } {
    const data: Record<string, string> = {
      heading: currentContent.heading || 'Your Heading Here',
      body: currentContent.body || 'Your body text will appear here.',
      buttonText: currentContent.buttonText || 'Click Here',
      buttonUrl: currentContent.buttonUrl || '#',
      imageUrl: currentContent.imageUrl || '',
      imageFit: currentContent.imageFit || 'cover',
    };

    let html = '';
    let css = '';

    if (templateType === 'custom' && customHtml) {
      html = customHtml;
    } else {
      const tmpl = availableTemplates.find((t) => t.id === templateId);
      if (tmpl) {
        html = tmpl.htmlTemplate || '';
        css = tmpl.css || '';
      }
    }

    if (!html) return { html: '<p style="color:#9ca3af;text-align:center;padding:40px;">Select a template and add content to see a preview</p>', css: '' };

    let rendered = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_: string, key: string, inner: string) => {
      return data[key] ? inner.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => data[k] || '') : '';
    });
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || '');

    return { html: rendered, css };
  }

  const preview = renderPreview();

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const contentArray = Object.entries(content).map(([key, c]) => {
      const [variant, locale] = key.includes('::') ? key.split('::') : ['default', key];
      return {
        locale,
        variant,
        heading: c.heading,
        body: c.body,
        buttonText: c.buttonText,
        buttonUrl: c.buttonUrl,
        imageUrl: c.imageUrl,
        imageFit: c.imageFit || 'cover',
      };
    });

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
          status,
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create CTA</h1>
          <p>Set up a new call-to-action</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create CTA'}
          </button>
          <Link href="/admin/ctas" className="btn btn-secondary">Cancel</Link>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        {/* Left: Form */}
        <div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Scope</label>
              <select className="form-select" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="global">Global (all articles)</option>
                <option value="vertical">Vertical-specific</option>
                <option value="article">Article-specific</option>
              </select>
            </div>
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

          {/* Template */}
          <div className="form-group">
            <label>Template</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button type="button" className={`btn btn-sm ${templateType === 'standard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTemplateType('standard')}>
                Standard
              </button>
              <button type="button" className={`btn btn-sm ${templateType === 'custom' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTemplateType('custom')}>
                Custom HTML
              </button>
            </div>
            {templateType === 'standard' ? (
              <div className="template-grid">
                {availableTemplates.map((t) => (
                  <div
                    key={t.id}
                    className={`template-card ${templateId === t.id ? 'selected' : ''}`}
                    onClick={() => setTemplateId(t.id)}
                  >
                    <h4>
                      {t.name}
                      {t.category === 'custom' && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--warning)', color: '#fff', fontWeight: 500 }}>
                          Custom
                        </span>
                      )}
                    </h4>
                    <p>{t.description || ''}</p>
                  </div>
                ))}
                {availableTemplates.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', gridColumn: '1 / -1' }}>Loading templates...</p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  className="form-textarea"
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  placeholder={'<div class="my-cta">\n  <div>{{heading}}</div>\n  <p>{{body}}</p>\n  <a href="{{buttonUrl}}">{{buttonText}}</a>\n</div>'}
                  style={{ minHeight: '160px', fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Use {'{{heading}}'}, {'{{body}}'}, {'{{buttonText}}'}, {'{{buttonUrl}}'}, {'{{imageUrl}}'} as variables
                </p>
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

          {/* Variants */}
          <div className="form-group">
            <label>Variants</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
              {variants.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`btn btn-sm ${activeVariant === v ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveVariant(v)}
                >
                  {v === 'default' ? 'Default' : v}
                </button>
              ))}
              {!showAddVariant ? (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddVariant(true)} style={{ fontSize: '13px' }}>
                  + Add Variant
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    placeholder="e.g. mid-article"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      if (newVariantName && !variants.includes(newVariantName)) {
                        setVariants([...variants, newVariantName]);
                        setActiveVariant(newVariantName);
                        const key = newVariantName + '::en';
                        if (!content[key]) {
                          setContent({
                            ...content,
                            [key]: { locale: 'en', variant: newVariantName, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover' },
                          });
                        }
                      }
                      setNewVariantName('');
                      setShowAddVariant(false);
                    }}
                    disabled={!newVariantName || variants.includes(newVariantName)}
                  >
                    Add
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setShowAddVariant(false); setNewVariantName(''); }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {activeVariant !== 'default' && slug && (
              <div style={{ marginBottom: '12px' }}>
                <div className="embed-code" onClick={() => navigator.clipboard.writeText(`<div data-cta="${slug}" data-variant="${activeVariant}"></div>`)}>
                  {`<div data-cta="${slug}" data-variant="${activeVariant}"></div>`}
                  <span className="copy-hint">Click to copy</span>
                </div>
              </div>
            )}
          </div>

          {/* Content by Locale */}
          <div className="form-group">
            <label>Content — {activeVariant === 'default' ? 'Default' : activeVariant}</label>
            <div className="locale-tabs">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`locale-tab ${activeLocale === l ? 'active' : ''}`}
                  onClick={() => {
                    const key = activeVariant + '::' + l;
                    if (!content[key]) {
                      setContent({
                        ...content,
                        [key]: { locale: l, variant: activeVariant, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover' },
                      });
                    }
                    setActiveLocale(l);
                  }}
                  style={{ opacity: enabledLocales.includes(l) ? 1 : 0.5 }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

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
              <label>Body</label>
              <textarea
                className="form-textarea"
                value={currentContent.body}
                onChange={(e) => updateContent(activeLocale, 'body', e.target.value)}
                placeholder="e.g. Reach 11,000+ crypto brands across 82 blockchains..."
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
              <label>Image</label>
              {currentContent.imageUrl && (
                <div style={{ marginBottom: '8px' }}>
                  <img
                    src={currentContent.imageUrl}
                    alt="Preview"
                    style={{
                      height: '120px', borderRadius: '8px',
                      objectFit: (currentContent.imageFit as React.CSSProperties['objectFit']) || 'cover',
                      display: 'block', border: '1px solid var(--border)',
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

          {/* Embed Code */}
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

          {error && <p style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
        </div>

        {/* Right: Preview Sidebar */}
        <div>
          {/* Live Preview */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '20px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Live Preview — {activeVariant === 'default' ? '' : activeVariant + ' / '}{activeLocale.toUpperCase()}
            </div>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.6%' }}>
              <style dangerouslySetInnerHTML={{ __html: preview.css }} />
              <div dangerouslySetInnerHTML={{ __html: preview.html }} />
            </div>
          </div>

          {/* Quick Info */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '20px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Summary
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Template:</span>{' '}
              <strong>{templateType === 'custom' ? 'Custom HTML' : (availableTemplates.find((t) => t.id === templateId)?.name || templateId)}</strong>
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Variants:</span>{' '}
              <strong>{variants.length}</strong>
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Locales:</span>{' '}
              <strong>{new Set(Object.keys(content).map((k) => k.split('::')[1])).size}</strong>
            </div>
            {(startDate || endDate) && (
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Schedule:</span>{' '}
                <strong>{startDate ? new Date(startDate).toLocaleDateString() : 'Now'} — {endDate ? new Date(endDate).toLocaleDateString() : 'Ongoing'}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
