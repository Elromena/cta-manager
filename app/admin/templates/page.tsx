'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

type FilterTab = 'all' | 'standard' | 'custom';

export default function TemplatesListPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createHtml, setCreateHtml] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  function fetchTemplates() {
    setLoading(true);
    fetch('/cta-admin/api/templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates || []);
      })
      .catch(() => showToast('Failed to load templates'))
      .finally(() => setLoading(false));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function getCategory(t: Template): 'Standard' | 'Custom' {
    return STANDARD_IDS.includes(t.id) ? 'Standard' : 'Custom';
  }

  const filtered = templates.filter((t) => {
    if (filter === 'standard') return STANDARD_IDS.includes(t.id);
    if (filter === 'custom') return !STANDARD_IDS.includes(t.id);
    return true;
  });

  async function handleCreate() {
    if (!createName.trim() || !createHtml.trim()) {
      showToast('Name and HTML are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/cta-admin/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          htmlTemplate: createHtml.trim(),
          css: '',
        }),
      });
      if (!res.ok) throw new Error('Create failed');
      showToast('Template created!');
      setCreateName('');
      setCreateHtml('');
      setShowCreate(false);
      fetchTemplates();
    } catch {
      showToast('Failed to create template');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading templates...
      </div>
    );
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'standard', label: 'Standard' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: 'var(--text)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            zIndex: 1000,
            fontSize: 14,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Templates</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Browse and manage your CTA templates
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancel' : '+ Create Template'}
        </button>
      </div>

      {/* Inline Create Form */}
      {showCreate && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Create New Template
          </h3>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Template Name
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Promo Banner"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              HTML Template
            </label>
            <textarea
              className="form-textarea"
              placeholder={'<div class="cta">\n  <h2>{{heading}}</h2>\n  <p>{{body}}</p>\n  <a href="{{buttonUrl}}">{{buttonText}}</a>\n</div>'}
              value={createHtml}
              onChange={(e) => setCreateHtml(e.target.value)}
              rows={8}
              style={{
                width: '100%',
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowCreate(false);
                setCreateName('');
                setCreateHtml('');
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderBottom: filter === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: filter === tab.key ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                background: filter === tab.key ? 'var(--accent)' : 'var(--border)',
                color: filter === tab.key ? '#fff' : 'var(--text-muted)',
                padding: '2px 7px',
                borderRadius: 10,
              }}
            >
              {tab.key === 'all'
                ? templates.length
                : tab.key === 'standard'
                  ? templates.filter((t) => STANDARD_IDS.includes(t.id)).length
                  : templates.filter((t) => !STANDARD_IDS.includes(t.id)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--text-muted)' }}></div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            No templates found
          </h3>
          <p style={{ fontSize: 14 }}>
            {filter !== 'all'
              ? `No ${filter} templates yet. Try a different filter or create one.`
              : 'Get started by creating your first template.'}
          </p>
        </div>
      )}

      {/* Template Grid */}
      {filtered.length > 0 && (
        <div className="template-grid">
          {filtered.map((t) => {
            const category = getCategory(t);
            const previewHtml = renderPreview(t.htmlTemplate, SAMPLE_DATA);

            return (
              <div
                key={t.id}
                className="template-card"
                onClick={() => router.push(`/admin/templates/${t.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {/* Live Preview Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    height: 120,
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--border)',
                    background: '#fff',
                    borderRadius: '12px 12px 0 0',
                  }}
                >
                  <div
                    style={{
                      transform: 'scale(0.4)',
                      transformOrigin: 'top left',
                      width: '250%',
                      height: 120,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                    }}
                  >
                    <style dangerouslySetInnerHTML={{ __html: t.css }} />
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: category === 'Standard' ? 'var(--accent)' : 'var(--warning)',
                        color: '#fff',
                      }}
                    >
                      {category}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {t.description || 'No description'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
