'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string;
  htmlTemplate: string;
  css: string;
  category?: string;
}

const STANDARD_IDS = ['banner', 'card', 'inline', 'image-text'];

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

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
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
        const list: Template[] = data.templates || [];
        const found = list.find((t) => t.id === id);
        if (found) {
          setTemplate(found);
          setEditHtml(found.htmlTemplate);
          setEditCss(found.css);
        }
      })
      .catch(() => showToast('Failed to load template'))
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    try {
      const res = await fetch('/cta-admin/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id, htmlTemplate: editHtml, css: editCss }),
      });
      if (!res.ok) throw new Error('Save failed');

      setTemplate({ ...template, htmlTemplate: editHtml, css: editCss });
      showToast('Template saved!');
    } catch {
      showToast('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!template) return;
    if (!confirm(`Reset "${template.name}" to its original default? Your customizations will be lost.`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/cta-admin/api/templates/reset?id=${template.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      const data = await res.json();

      setEditHtml(data.htmlTemplate);
      setEditCss(data.css);
      setTemplate({ ...template, htmlTemplate: data.htmlTemplate, css: data.css });
      showToast('Template reset to default!');
    } catch {
      showToast('Failed to reset template');
    } finally {
      setSaving(false);
    }
  }

  const isStandard = template ? STANDARD_IDS.includes(template.id) : false;
  const previewHtml = template ? renderPreview(editHtml, SAMPLE_DATA) : '';

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading template...</div>;
  }

  if (!template) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Template not found.</p>
        <button className="btn btn-secondary" onClick={() => router.push('/admin/templates')}>
          Back to Templates
        </button>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: 'var(--text)', color: '#fff',
          padding: '12px 20px', borderRadius: 8, zIndex: 1000, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Edit: {template.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{template.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => router.push(`/admin/templates/${template.id}`)}>
            Back
          </button>
          {isStandard && (
            <button onClick={handleReset} disabled={saving} className="btn btn-secondary" style={{ fontSize: 13 }}>
              Reset to Default
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ fontSize: 13 }}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 'calc(100vh - 200px)' }}>
        {/* Live preview */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 32, minHeight: 180,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Live Preview
          </div>
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
    </div>
  );
}
