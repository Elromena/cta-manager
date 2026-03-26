'use client';

import { useEffect, useState } from 'react';

interface CtaSummary {
  slug: string;
  name: string;
  scope: string;
  status: string;
  vertical?: string;
  templateType: string;
  content: Array<{ locale: string }>;
}

interface AnalyticsStat {
  ctaSlug: string;
  totalImpressions: number;
  totalClicks: number;
}

export default function AdminDashboard() {
  const [ctas, setCtas] = useState<CtaSummary[]>([]);
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/cta').then((r) => r.json()),
      fetch('/api/analytics?days=30').then((r) => r.json()).catch(() => ({ stats: [] })),
    ]).then(([ctaData, analyticsData]) => {
      setCtas(ctaData.ctas || []);
      setStats(analyticsData.stats || []);
      setLoading(false);
    });
  }, []);

  const totalImpressions = stats.reduce((sum, s) => sum + (s.totalImpressions || 0), 0);
  const totalClicks = stats.reduce((sum, s) => sum + (s.totalClicks || 0), 0);
  const activeCtas = ctas.filter((c) => c.status === 'active').length;

  if (loading) {
    return <div className="empty-state"><p>Loading dashboard...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your CTA performance</p>
        </div>
        <a href="/admin/ctas/create" className="btn btn-primary">+ Create CTA</a>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total CTAs</div>
          <div className="stat-value">{ctas.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{activeCtas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Impressions (30d)</div>
          <div className="stat-value">{totalImpressions.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clicks (30d)</div>
          <div className="stat-value">{totalClicks.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg CTR</div>
          <div className="stat-value">
            {totalImpressions > 0
              ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%'
              : '—'}
          </div>
        </div>
      </div>

      {ctas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No CTAs yet</h3>
          <p>Create your first CTA to get started</p>
          <a href="/admin/ctas/create" className="btn btn-primary">Create CTA</a>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Scope</th>
              <th>Status</th>
              <th>Locales</th>
              <th>Impressions</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {ctas.map((cta) => {
              const ctaStat = stats.find((s) => s.ctaSlug === cta.slug);
              return (
                <tr key={cta.slug}>
                  <td>
                    <a href={`/admin/ctas/${cta.slug}`} style={{ fontWeight: 600 }}>
                      {cta.name}
                    </a>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent)' }}>
                    {cta.slug}
                  </td>
                  <td>
                    <span className={`badge badge-${cta.scope}`}>
                      {cta.scope}
                      {cta.vertical ? `: ${cta.vertical}` : ''}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${cta.status}`}>{cta.status}</span>
                  </td>
                  <td>{cta.content?.map((c) => c.locale.toUpperCase()).join(', ')}</td>
                  <td>{(ctaStat?.totalImpressions || 0).toLocaleString()}</td>
                  <td>{(ctaStat?.totalClicks || 0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
