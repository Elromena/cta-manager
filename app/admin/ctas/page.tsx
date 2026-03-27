'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Cta {
  slug: string;
  name: string;
  scope: string;
  status: string;
  vertical?: string;
  templateType: string;
  createdAt: string;
  content: Array<{ locale: string }>;
  usage?: Array<{ pageUrl: string }>;
}

export default function CtasList() {
  const [ctas, setCtas] = useState<Cta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetch('/cta-admin/api/cta')
      .then((r) => r.json())
      .then((data) => {
        setCtas(data.ctas || []);
        setLoading(false);
      });
  }, []);

  const filtered = ctas.filter((cta) => {
    if (filter === 'active') return cta.status === 'active';
    if (filter === 'inactive') return cta.status !== 'active';
    return true;
  });

  if (loading) {
    return <div className="empty-state"><p>Loading CTAs...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>CTAs</h1>
          <p>{ctas.length} total CTAs</p>
        </div>
        <Link href="/admin/ctas/create" className="btn btn-primary">+ Create CTA</Link>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No CTAs found</h3>
          <p>{filter !== 'all' ? 'Try changing the filter' : 'Create your first CTA'}</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Embed Code</th>
              <th>Scope</th>
              <th>Template</th>
              <th>Status</th>
              <th>Locales</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cta) => (
              <tr key={cta.slug}>
                <td>
                  <Link href={`/admin/ctas/${cta.slug}`} style={{ fontWeight: 600 }}>
                    {cta.name}
                  </Link>
                </td>
                <td>
                  <code
                    className="embed-code"
                    onClick={() => {
                      navigator.clipboard.writeText(`<div data-cta="${cta.slug}"></div>`);
                    }}
                    style={{ cursor: 'pointer', fontSize: '12px' }}
                    title="Click to copy"
                  >
                    {`<div data-cta="${cta.slug}"></div>`}
                  </code>
                </td>
                <td>
                  <span className={`badge badge-${cta.scope}`}>
                    {cta.scope}{cta.vertical ? `: ${cta.vertical}` : ''}
                  </span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{cta.templateType}</td>
                <td>
                  <span className={`badge badge-${cta.status}`}>{cta.status}</span>
                </td>
                <td>{cta.content?.map((c) => c.locale.toUpperCase()).join(', ')}</td>
                <td>
                  <Link href={`/admin/ctas/${cta.slug}`} className="btn btn-sm btn-secondary">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
