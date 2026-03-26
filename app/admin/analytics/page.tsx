'use client';

import { useEffect, useState } from 'react';

interface CtaStat {
  ctaSlug: string;
  totalImpressions: number;
  totalClicks: number;
}

interface DailyTrend {
  date: string;
  impressions: number;
  clicks: number;
}

interface PageBreakdown {
  pageUrl: string;
  locale: string;
  totalImpressions: number;
  totalClicks: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<CtaStat[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [detail, setDetail] = useState<{
    totals: { impressions: number; clicks: number; ctr: string };
    dailyTrend: DailyTrend[];
    pageBreakdown: PageBreakdown[];
    articlesUsing: number;
  } | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        setOverview(data.stats || []);
        setLoading(false);
      });
  }, [days]);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      return;
    }
    fetch(`/api/analytics?slug=${selectedSlug}&days=${days}`)
      .then((r) => r.json())
      .then((data) => setDetail(data));
  }, [selectedSlug, days]);

  const totalImpressions = overview.reduce((s, v) => s + (v.totalImpressions || 0), 0);
  const totalClicks = overview.reduce((s, v) => s + (v.totalClicks || 0), 0);

  if (loading) return <div className="empty-state"><p>Loading analytics...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>CTA performance across all articles</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Impressions</div>
          <div className="stat-value">{totalImpressions.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value">{totalClicks.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average CTR</div>
          <div className="stat-value">
            {totalImpressions > 0
              ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%'
              : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active CTAs</div>
          <div className="stat-value">{overview.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* CTA Ranking Table */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>CTA Performance Ranking</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>CTA</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody>
              {overview
                .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
                .map((stat) => {
                  const ctr = stat.totalImpressions > 0
                    ? ((stat.totalClicks / stat.totalImpressions) * 100).toFixed(1) + '%'
                    : '—';
                  return (
                    <tr
                      key={stat.ctaSlug}
                      onClick={() => setSelectedSlug(stat.ctaSlug)}
                      style={{
                        cursor: 'pointer',
                        background: selectedSlug === stat.ctaSlug ? 'var(--accent-light)' : undefined,
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{stat.ctaSlug}</td>
                      <td>{(stat.totalImpressions || 0).toLocaleString()}</td>
                      <td>{(stat.totalClicks || 0).toLocaleString()}</td>
                      <td>{ctr}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div>
          {detail ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                📊 {selectedSlug}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Used in {detail.articlesUsing} articles · {days}-day period
              </p>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">Impressions</div>
                  <div className="stat-value" style={{ fontSize: '24px' }}>
                    {detail.totals.impressions.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Clicks</div>
                  <div className="stat-value" style={{ fontSize: '24px' }}>
                    {detail.totals.clicks.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">CTR</div>
                  <div className="stat-value" style={{ fontSize: '24px' }}>
                    {detail.totals.ctr}
                  </div>
                </div>
              </div>

              {/* Daily Trend (simple bar representation) */}
              {detail.dailyTrend.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    Daily Impressions
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px' }}>
                    {detail.dailyTrend.map((d) => {
                      const maxImp = Math.max(...detail.dailyTrend.map((t) => t.impressions || 1));
                      const height = ((d.impressions || 0) / maxImp) * 100;
                      return (
                        <div
                          key={d.date}
                          title={`${d.date}: ${d.impressions} imp, ${d.clicks} clicks`}
                          style={{
                            flex: 1,
                            height: `${Math.max(height, 2)}%`,
                            background: 'var(--accent)',
                            borderRadius: '2px 2px 0 0',
                            minWidth: '4px',
                            opacity: 0.8,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Pages */}
              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Top Pages
              </h4>
              {detail.pageBreakdown
                .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
                .slice(0, 5)
                .map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.pageUrl}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {p.locale?.toUpperCase()} · {p.totalImpressions} imp · {p.totalClicks} clicks ·{' '}
                      {p.totalImpressions > 0
                        ? ((p.totalClicks / p.totalImpressions) * 100).toFixed(1) + '% CTR'
                        : '—'}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              <p>Click a CTA to see detailed analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
