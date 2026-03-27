'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

interface RecentEvent {
  id: number;
  ctaSlug: string;
  pageUrl: string;
  locale: string;
  eventType: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [ctas, setCtas] = useState<CtaSummary[]>([]);
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [prevStats, setPrevStats] = useState<AnalyticsStat[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/cta-admin/api/cta').then((r) => r.json()),
      fetch('/cta-admin/api/analytics?days=30').then((r) => r.json()).catch(() => ({ stats: [] })),
      fetch('/cta-admin/api/analytics?days=60').then((r) => r.json()).catch(() => ({ stats: [] })),
      fetch('/cta-admin/api/analytics/recent').then((r) => r.json()).catch(() => ({ events: [] })),
    ]).then(([ctaData, current, sixtyDay, recentData]) => {
      setCtas(ctaData.ctas || []);
      setStats(current.stats || []);
      setRecentEvents(recentData.events || []);

      // Derive prior 30d by subtracting current from 60d
      const currentStats: AnalyticsStat[] = current.stats || [];
      const sixtyStats: AnalyticsStat[] = sixtyDay.stats || [];
      const prev = sixtyStats.map((s60) => {
        const s30 = currentStats.find((c) => c.ctaSlug === s60.ctaSlug);
        return {
          ctaSlug: s60.ctaSlug,
          totalImpressions: s60.totalImpressions - (s30?.totalImpressions || 0),
          totalClicks: s60.totalClicks - (s30?.totalClicks || 0),
        };
      });
      setPrevStats(prev);
      setLoading(false);
    });
  }, []);

  const totalImpressions = stats.reduce((sum, s) => sum + (s.totalImpressions || 0), 0);
  const totalClicks = stats.reduce((sum, s) => sum + (s.totalClicks || 0), 0);
  const prevImpressions = prevStats.reduce((sum, s) => sum + (s.totalImpressions || 0), 0);
  const prevClicks = prevStats.reduce((sum, s) => sum + (s.totalClicks || 0), 0);
  const activeCtas = ctas.filter((c) => c.status === 'active').length;

  function pctChange(current: number, previous: number): { value: string; direction: 'up' | 'down' | 'flat' } {
    if (previous === 0) return { value: current > 0 ? '+100%' : '0%', direction: current > 0 ? 'up' : 'flat' };
    const pct = ((current - previous) / previous) * 100;
    if (pct === 0) return { value: '0%', direction: 'flat' };
    return {
      value: (pct > 0 ? '+' : '') + pct.toFixed(1) + '%',
      direction: pct > 0 ? 'up' : 'down',
    };
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function truncateUrl(url: string): string {
    try {
      const path = new URL(url).pathname;
      return path.length > 40 ? path.slice(0, 37) + '...' : path;
    } catch {
      return url.length > 40 ? url.slice(0, 37) + '...' : url;
    }
  }

  // Top 5 by CTR
  const top5 = [...stats]
    .filter((s) => s.totalImpressions > 0)
    .map((s) => ({
      ...s,
      ctr: (s.totalClicks / s.totalImpressions) * 100,
      name: ctas.find((c) => c.slug === s.ctaSlug)?.name || s.ctaSlug,
    }))
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 5);

  const impressionChange = pctChange(totalImpressions, prevImpressions);
  const clickChange = pctChange(totalClicks, prevClicks);

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
        <Link href="/admin/ctas/create" className="btn btn-primary">+ Create CTA</Link>
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
          <div className={`stat-change ${impressionChange.direction}`}>
            {impressionChange.direction === 'up' ? '\u2191' : impressionChange.direction === 'down' ? '\u2193' : ''} {impressionChange.value} vs prior 30d
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clicks (30d)</div>
          <div className="stat-value">{totalClicks.toLocaleString()}</div>
          <div className={`stat-change ${clickChange.direction}`}>
            {clickChange.direction === 'up' ? '\u2191' : clickChange.direction === 'down' ? '\u2193' : ''} {clickChange.value} vs prior 30d
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg CTR</div>
          <div className="stat-value">
            {totalImpressions > 0
              ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%'
              : '\u2014'}
          </div>
        </div>
      </div>

      {ctas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No CTAs yet</h3>
          <p>Create your first CTA to get started</p>
          <Link href="/admin/ctas/create" className="btn btn-primary">Create CTA</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
          {/* Top 5 CTAs */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top Performing CTAs</h3>
            {top5.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No performance data yet</p>
            ) : (
              <table className="data-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>CTA</th>
                    <th>Impr.</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.map((item, i) => (
                    <tr key={item.ctaSlug}>
                      <td style={{ color: 'var(--text-muted)', width: 30 }}>{i + 1}</td>
                      <td>
                        <Link href={`/admin/ctas/${item.ctaSlug}`} style={{ fontWeight: 600 }}>
                          {item.name}
                        </Link>
                      </td>
                      <td>{item.totalImpressions.toLocaleString()}</td>
                      <td>{item.totalClicks.toLocaleString()}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{item.ctr.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Link href="/admin/analytics" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>
              View all analytics &rarr;
            </Link>
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h3>
            {recentEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No events recorded yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: event.eventType === 'click' ? 'var(--success)' : 'var(--accent)',
                    }} />
                    <span style={{ fontWeight: 600, minWidth: 80 }}>{event.ctaSlug}</span>
                    <span style={{ color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {truncateUrl(event.pageUrl)}
                    </span>
                    <span className="badge" style={{ fontSize: 10, padding: '2px 6px' }}>
                      {(event.locale || 'en').toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
