'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const LOCALES = ['en', 'ru', 'es', 'ko', 'zh', 'ja', 'tr'];
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish',
  ko: 'Korean', zh: 'Chinese', ja: 'Japanese', tr: 'Turkish',
};

const TEMPLATES = [
  { id: 'banner', name: 'Banner', description: 'Full-width gradient banner' },
  { id: 'card', name: 'Card', description: 'Compact card with image' },
  { id: 'inline', name: 'Inline', description: 'Minimal inline CTA' },
  { id: 'image-text', name: 'Image + Text', description: 'Side-by-side layout' },
];

interface ContentItem {
  locale: string;
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
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
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [activeLocale, setActiveLocale] = useState('en');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    fetch(`/api/cta/${slug}`)
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

        const contentMap: Record<string, ContentItem> = {};
        (data.content || []).forEach((c: ContentItem) => {
          contentMap[c.locale] = c;
        });
        setContent(contentMap);
        setLoading(false);
      })
      .catch(() => {
        setError('CTA not found');
        setLoading(false);
      });
  }, [slug]);

  const updateContent = (locale: string, field: string, value: string) => {
    setContent({
      ...content,
      [locale]: {
        ...(content[locale] || { locale, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '' }),
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const contentArray = Object.entries(content).map(([locale, c]) => ({
      locale,
      heading: c.heading,
      body: c.body,
      buttonText: c.buttonText,
      buttonUrl: c.buttonUrl,
      imageUrl: c.imageUrl,
    }));

    try {
      const res = await fetch(`/api/cta/${slug}`, {
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
      await fetch(`/api/cta/${slug}`, { method: 'DELETE' });
      router.push('/admin/ctas');
    } catch {
      setError('Failed to delete');
    }
  };

  if (loading) return <div className="empty-state"><p>Loading CTA...</p></div>;
  if (error && !cta) return <div className="empty-state"><h3>{error}</h3></div>;

  const currentContent = content[activeLocale] || {
    locale: activeLocale, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '',
  };

  const enabledLocales = Object.keys(content);

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
            ⚠️ This CTA is used in <strong>{cta?.usage?.length || 0} articles</strong>.
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
              <textarea
                className="form-textarea"
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                style={{ minHeight: '160px', fontFamily: 'monospace' }}
                placeholder='<div class="my-cta">{{heading}}</div>'
              />
            )}
          </div>

          {/* Content by Locale */}
          <div className="form-group">
            <label>Content by Locale</label>
            <div className="locale-tabs">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`locale-tab ${activeLocale === l ? 'active' : ''}`}
                  onClick={() => {
                    if (!content[l]) {
                      setContent({
                        ...content,
                        [l]: { locale: l, heading: '', body: '', buttonText: '', buttonUrl: '', imageUrl: '' },
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
              <label>Image URL</label>
              <input
                className="form-input"
                value={currentContent.imageUrl}
                onChange={(e) => updateContent(activeLocale, 'imageUrl', e.target.value)}
              />
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

        {/* Right: Usage & Preview Panel */}
        <div>
          {/* Usage */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>
              📚 Used in {cta?.usage?.length || 0} pages
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

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  );
}
