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

const VARIABLES = [
  { name: '{{heading}}', desc: 'Main headline text' },
  { name: '{{body}}', desc: 'Body / description text' },
  { name: '{{buttonText}}', desc: 'CTA button label' },
  { name: '{{buttonUrl}}', desc: 'CTA button link URL' },
  { name: '{{imageUrl}}', desc: 'Image source URL' },
  { name: '{{#imageUrl}}...{{/imageUrl}}', desc: 'Conditional image block' },
];

function renderPreview(template: string, data: Record<string, string>): string {
  let result = template;
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_: string, key: string, content: string) => {
    return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => data[k] || '') : '';
  });
  result = result.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || '');
  return result;
}

export default function TemplateSinglePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/cta-admin/api/templates')
      .then((r) => r.json())
      .then((data) => {
        const list: Template[] = data.templates || [];
        const found = list.find((t) => t.id === id);
        if (found) {
          setTemplate(found);
        }
      })
      .catch(() => showToast('Failed to load template'))
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleDelete() {
    if (!template) return;
    if (!confirm(`Delete "${template.name}"? This action cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/cta-admin/api/templates/${template.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      showToast('Template deleted!');
      setTimeout(() => router.push('/admin/templates'), 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

  const isCustom = template ? !STANDARD_IDS.includes(template.id) : false;
  const previewHtml = template ? renderPreview(template.htmlTemplate, SAMPLE_DATA) : '';

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
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{template.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{template.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => router.push('/admin/templates')}>
            Back to Templates
          </button>
          <button className="btn btn-primary" onClick={() => router.push(`/admin/templates/${template.id}/edit`)}>
            Edit Template
          </button>
          {isCustom && (
            <button
              className="btn"
              disabled={deleting}
              onClick={handleDelete}
              style={{
                background: 'var(--error, #ef4444)', color: '#fff', border: 'none',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Info Panel */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: 24,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
              Template Info
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Name</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{template.name}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Category</div>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                background: isCustom ? 'rgba(234,179,8,0.12)' : 'rgba(99,102,241,0.12)',
                color: isCustom ? 'var(--warning, #eab308)' : 'var(--accent, #6366f1)',
              }}>
                {isCustom ? 'Custom' : 'Standard'}
              </span>
            </div>

            <div style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ID</div>
              <code style={{
                fontSize: 12, padding: '2px 8px', background: 'var(--bg-hover, #f1f5f9)',
                borderRadius: 4, fontFamily: 'monospace',
              }}>
                {template.id}
              </code>
            </div>
          </div>

          {/* Variable Reference */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: 24, marginTop: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              Variable Reference
            </div>
            {VARIABLES.map((v) => (
              <div key={v.name} style={{ marginBottom: 10 }}>
                <code style={{
                  fontSize: 11, fontFamily: 'monospace', color: 'var(--accent, #6366f1)',
                  display: 'block',
                }}>
                  {v.name}
                </code>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Preview */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 32,
            minHeight: 300,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
              Preview
            </div>
            <style dangerouslySetInnerHTML={{ __html: template.css }} />
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
