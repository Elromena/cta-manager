'use client';

import { useEffect, useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  htmlTemplate: string;
  css: string;
}

const SAMPLE_DATA: Record<string, string> = {
  heading: 'Supercharge Your Campaigns',
  body: 'Join thousands of advertisers using blockchain-powered targeting to reach the right audience.',
  buttonText: 'Get Started Free',
  buttonUrl: '#',
  imageUrl: 'https://placehold.co/600x400/6366f1/white?text=CTA+Image',
};

function renderPreview(template: string, data: Record<string, string>): string {
  let result = template;
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_: string, key: string, content: string) => {
    return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => data[k] || '') : '';
  });
  result = result.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || '');
  return result;
}

export default function TemplatesEditor() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [editHtml, setEditHtml] = useState('');
  const [editCss, setEditCss] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');

  useEffect(() => {
    fetch('/cta-admin/api/templates')
      .then((r) => r.json())
      .then((data) => {
        const list = data.templates || [];
        setTemplates(list);
        if (list.length > 0) {
          selectTemplate(list[0]);
        }
      })
      .catch(() => showToast('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  function selectTemplate(t: Template) {
    setSelected(t);
    setEditHtml(t.htmlTemplate);
    setEditCss(t.css);
    setActiveTab('html');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/cta-admin/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, htmlTemplate: editHtml, css: editCss }),
      });
      if (!res.ok) throw new Error('Save failed');

      const updated = templates.map((t) =>
        t.id === selected.id ? { ...t, htmlTemplate: editHtml, css: editCss } : t
      );
      setTemplates(updated);
      setSelected({ ...selected, htmlTemplate: editHtml, css: editCss });
      showToast('Template saved!');
    } catch {
      showToast('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!selected) return;
    if (!confirm(`Reset "${selected.name}" to its original default? Your customizations will be lost.`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/cta-admin/api/templates/reset?id=${selected.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      const data = await res.json();

      setEditHtml(data.htmlTemplate);
      setEditCss(data.css);
      const updated = templates.map((t) =>
        t.id === selected.id ? { ...t, htmlTemplate: data.htmlTemplate, css: data.css } : t
      );
      setTemplates(updated);
      setSelected({ ...selected, htmlTemplate: data.htmlTemplate, css: data.css });
      showToast('Template reset to default!');
    } catch {
      showToast('Failed to reset template');
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = selected ? renderPreview(editHtml, SAMPLE_DATA) : '';

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading templates...</div>;
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#111827', color: '#fff',
          padding: '12px 20px', borderRadius: 8, zIndex: 1000, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Template Editor</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Customize the HTML and CSS of your standard CTA templates</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 200px)' }}>
        {/* Template list */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Templates</div>
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                marginBottom: 4,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: selected?.id === t.id ? 'var(--accent)' : 'transparent',
                color: selected?.id === t.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: selected?.id === t.id ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.15s',
              }}
            >
              {t.name}
              <div style={{
                fontSize: 11,
                marginTop: 2,
                opacity: 0.7,
                color: selected?.id === t.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
              }}>
                {t.description}
              </div>
            </button>
          ))}

          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Variables</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8, fontFamily: 'monospace' }}>
              {'{{heading}}'}<br />
              {'{{body}}'}<br />
              {'{{buttonText}}'}<br />
              {'{{buttonUrl}}'}<br />
              {'{{imageUrl}}'}<br />
              {'{{#imageUrl}}...{{/imageUrl}}'}
            </div>
          </div>
        </div>

        {/* Editor + Preview */}
        {selected && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Action bar */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={handleReset} disabled={saving} className="btn btn-secondary btn-sm" style={{ fontSize: 13 }}>
                Reset to Default
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ fontSize: 13 }}>
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>

            {/* Live preview */}
            <div style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 32, minHeight: 180,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Live Preview</div>
              <style dangerouslySetInnerHTML={{ __html: editCss }} />
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            {/* Editor tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
              {(['html', 'css'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                    background: 'transparent',
                    color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', textTransform: 'uppercase',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Code editor */}
            <textarea
              value={activeTab === 'html' ? editHtml : editCss}
              onChange={(e) => activeTab === 'html' ? setEditHtml(e.target.value) : setEditCss(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, minHeight: 300,
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: 13, lineHeight: 1.6, padding: 20,
                background: '#f8f9fa', color: '#1e293b',
                border: '1px solid var(--border)', borderRadius: 8,
                resize: 'vertical', tabSize: 2,
                whiteSpace: 'pre', overflowX: 'auto',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
