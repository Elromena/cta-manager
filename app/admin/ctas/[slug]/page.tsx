'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const LOCALES = ['en', 'ru', 'es', 'ko', 'zh', 'ja', 'tr'];
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish',
  ko: 'Korean', zh: 'Chinese', ja: 'Japanese', tr: 'Turkish',
};

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

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

interface UsageItem {
  pageUrl: string;
  locale: string;
  lastSeenAt: string;
}

interface CtaData {
  id: string;
  slug: string;
  name: string;
  scope: string;
  vertical?: string;
  templateType: string;
  templateId?: string;
  customHtml?: string;
  status: string;
  content: ContentItem[];
  usage: UsageItem[];
}

export default function EditCta() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [cta, setCta] = useState<CtaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [activeLocale, setActiveLocale] = useState('en');
  const [activeVariant, setActiveVariant] = useState('default');
  const [variants, setVariants] = useState<string[]>(['default']);
  const [newVariantName, setNewVariantName] = useState('');
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Scheduling state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Save as Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Dynamic templates
  const [availableTemplates, setAvailableTemplates] = useState<TemplateItem[]>([]);

  // Editable state
  const [name, setName] = useState('');
  const [scope, setScope] = useState('global');
  const [vertical, setVertical] = useState('');
  const [templateType, setTemplateType] = useState('standard');
  const [templateId, setTemplateId] = useState('banner');
  const [customHtml, setCustomHtml] = useState('');
  const [status, setStatus] = useState('active');
  const [content, setContent] = useState<Record<string, ContentItem>>({});

  useEffect(() => {
    fetch('/cta-admin/api/templates')
      .then((r) => r.json())
      .then((data) => setAvailableTemplates(data.templates || []))
      .catch(() => {});

    fetch(`/cta-admin/api/cta/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setCta(data);
        setName(data.name);
        setScope(data.scope || 'global');
        setVertical(data.vertical || '');
        setTemplateType(data.templateType || 'standard');
        setTemplateId(data.templateId || 'banner');
        setCustomHtml(data.customHtml || '');
        setStatus(data.status || 'active');
        setStartDate(data.startDate?.slice(0, 16) || '');
        setEndDate(data.endDate?.slice(0, 16) || '');

        // Group content by variant::locale key
        const contentMap: Record<string, ContentItem> = {};
        const variantSet = new Set<string>();
        (data.content || []).forEach((c: ContentItem) => {
          const v = c.variant || 'default';
          variantSet.add(v);
          const key = v + '::' + c.locale;
          contentMap[key] = { ...c, variant: v };
        });
        setContent(contentMap);
        const variantList = Array.from(variantSet);
        if (variantList.length === 0) variantList.push('default');
        setVariants(variantList);
        setLoading(false);
      })
      .catch(() => {
        setError('CTA not found');
        setLoading(false);
      });
  }, [slug]);

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

  const contentKey = activeVariant + '::' + activeLocale;

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

  const handleSave = async () => {
    setSaving(true);
    setError('');

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
      const res = await fetch(`/cta-admin/api/cta/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
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

      if (!res.ok) throw new Error('Failed to save');
      setToast('CTA updated successfully');
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/cta-admin/api/cta/${slug}`, { method: 'DELETE' });
      router.push('/admin/ctas');
    } catch {
      setError('Failed to delete');
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/cta-admin/api/cta/${slug}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setToast('CTA duplicated!');
      router.push(`/admin/ctas/${data.slug}`);
    } catch {
      setToast('Failed to duplicate');
    }
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
      setToast('Template saved!');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to save template');
    }
  };

  if (loading) return <div className="empty-state"><p>Loading CTA...</p></div>;
  if (error && !cta) return <div className="empty-state"><h3>{error}</h3></div>;

  const currentContent = content[contentKey] || {
    locale: activeLocale, variant: activeVariant, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '', imageFit: 'cover',
  };

  // Get locales that have content for the active variant
  const enabledLocales = Object.keys(content)
    .filter((k) => k.startsWith(activeVariant + '::'))
    .map((k) => k.split('::')[1]);

  // Live preview rendering
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
      const tmpl = availableTemplates.find((t: any) => t.id === templateId);
      if (tmpl) {
        html = (tmpl as any).htmlTemplate || '';
        css = (tmpl as any).css || '';
      }
    }

    if (!html) return { html: '<p style="color:#9ca3af;text-align:center;padding:40px;">Add content to see a preview</p>', css: '' };

    let rendered = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_: string, key: string, content: string) => {
      return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => data[k] || '') : '';
    });
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || '');

    return { html: rendered, css };
  }

  const preview = renderPreview();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Edit: {name}</h1>
          <p>
            Slug: <code style={{ color: 'var(--accent)' }}>{slug}</code>
            {' · '}
            <span className={`badge badge-${status}`}>{status}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDuplicate}
          >
            Duplicate
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <p style={{ marginBottom: '12px' }}>
            Warning: This CTA is used in <strong>{cta?.usage?.length || 0} articles</strong>.
            Are you sure you want to delete it?
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Yes, delete permanently
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        {/* Left: Edit Form */}
        <div>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Scope</label>
              <select className="form-select" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="global">Global</option>
                <option value="vertical">Vertical</option>
                <option value="article">Article</option>
              </select>
            </div>
            {scope === 'vertical' && (
              <div className="form-group">
                <label>Vertical</label>
                <select className="form-select" value={vertical} onChange={(e) => setVertical(e.target.value)}>
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

          {/* Template */}
          <div className="form-group">
            <label>Template</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                className={`btn btn-sm ${templateType === 'standard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTemplateType('standard')}
              >Standard</button>
              <button
                type="button"
                className={`btn btn-sm ${templateType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTemplateType('custom')}
              >Custom HTML</button>
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
                        <span style={{
                          marginLeft: '8px', fontSize: '11px', padding: '2px 6px',
                          borderRadius: '4px', background: 'var(--warning)', color: '#fff', fontWeight: 500,
                        }}>Custom</span>
                      )}
                    </h4>
                    <p>{t.description || ''}</p>
                  </div>
                ))}
                {availableTemplates.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', gridColumn: '1 / -1' }}>
                    Loading templates...
                  </p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  className="form-textarea"
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  style={{ minHeight: '160px', fontFamily: 'monospace' }}
                  placeholder='<div class="my-cta">{{heading}}</div>'
                />
                {/* Save as Template */}
                {!showSaveTemplate ? (
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowSaveTemplate(true)} style={{ marginTop: '8px' }}>
                    Save as Template
                  </button>
                ) : (
                  <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Template Name</label>
                      <input className="form-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="My Custom Template" />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-primary" onClick={handleSaveAsTemplate}>Save Template</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowSaveTemplate(false)}>Cancel</button>
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
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowAddVariant(true)}
                  style={{ fontSize: '13px' }}
                >
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
                        // Initialize default locale content for this variant
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
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => { setShowAddVariant(false); setNewVariantName(''); }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {activeVariant !== 'default' && (
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
              />
            </div>
            <div className="form-group">
              <label>Body</label>
              <textarea
                className="form-textarea"
                value={currentContent.body}
                onChange={(e) => updateContent(activeLocale, 'body', e.target.value)}
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
                />
              </div>
              <div className="form-group">
                <label>Button URL</label>
                <input
                  className="form-input"
                  value={currentContent.buttonUrl}
                  onChange={(e) => updateContent(activeLocale, 'buttonUrl', e.target.value)}
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

          {/* Embed Code */}
          <div className="form-group">
            <label>Embed Code</label>
            <div
              className="embed-code"
              onClick={() => navigator.clipboard.writeText(`<div data-cta="${slug}"></div>`)}
            >
              {`<div data-cta="${slug}"></div>`}
              <span className="copy-hint">Click to copy</span>
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', marginTop: '8px' }}>{error}</p>}
        </div>

        {/* Right: Preview & Usage Panel */}
        <div>
          {/* Live Preview */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '20px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Live Preview — {activeLocale.toUpperCase()}
            </div>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.6%' }}>
              <style dangerouslySetInnerHTML={{ __html: preview.css }} />
              <div dangerouslySetInnerHTML={{ __html: preview.html }} />
            </div>
          </div>

          {/* Usage */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>
              Used in {cta?.usage?.length || 0} pages
            </h3>
            {(!cta?.usage || cta.usage.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                This CTA hasn&apos;t been detected in any articles yet.
              </p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {cta.usage.map((u, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 0',
                      borderBottom: i < cta.usage.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: '13px',
                    }}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPreviewUrl(`${u.pageUrl}?admin-preview=true`);
                      }}
                      style={{ wordBreak: 'break-all' }}
                    >
                      {u.pageUrl}
                    </a>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                      {u.locale?.toUpperCase()} · Last seen: {new Date(u.lastSeenAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Page Preview</span>
                <button className="btn btn-sm btn-secondary" onClick={() => setPreviewUrl('')}>Close</button>
              </div>
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '500px', border: 'none' }}
                title="Page Preview"
              />
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
