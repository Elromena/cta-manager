'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageEntry {
  ctaSlug: string;
  pageUrl: string;
  locale: string;
  lastSeenAt: string;
}

interface CtaInfo {
  slug: string;
  name: string;
}

interface PostGroup {
  pageUrl: string;
  locale: string;
  lastSeenAt: string;
  ctas: string[];
}

export default function PostsLibrary() {
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [ctaMap, setCtaMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'posts' | 'ctas'>('posts');
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/cta-admin/api/cta').then((r) => r.json()),
    ]).then(([ctaData]) => {
      const allCtas: CtaInfo[] = ctaData.ctas || [];
      const map: Record<string, string> = {};
      const allUsage: UsageEntry[] = [];

      allCtas.forEach((cta: any) => {
        map[cta.slug] = cta.name;
        if (cta.usage) {
          cta.usage.forEach((u: any) => {
            allUsage.push({
              ctaSlug: cta.slug,
              pageUrl: u.pageUrl,
              locale: u.locale,
              lastSeenAt: u.lastSeenAt,
            });
          });
        }
      });

      setCtaMap(map);
      setUsage(allUsage);
      setLoading(false);
    });
  }, []);

  // Group by post URL
  const postGroups: PostGroup[] = [];
  const postMap = new Map<string, PostGroup>();

  usage.forEach((u) => {
    const key = u.pageUrl;
    if (!postMap.has(key)) {
      postMap.set(key, {
        pageUrl: u.pageUrl,
        locale: u.locale,
        lastSeenAt: u.lastSeenAt,
        ctas: [],
      });
    }
    const group = postMap.get(key)!;
    if (!group.ctas.includes(u.ctaSlug)) {
      group.ctas.push(u.ctaSlug);
    }
    if (u.lastSeenAt > group.lastSeenAt) {
      group.lastSeenAt = u.lastSeenAt;
    }
  });

  postMap.forEach((v) => postGroups.push(v));
  postGroups.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

  // Group by CTA
  const ctaGroups: { slug: string; name: string; posts: string[] }[] = [];
  const ctaGroupMap = new Map<string, string[]>();

  usage.forEach((u) => {
    if (!ctaGroupMap.has(u.ctaSlug)) {
      ctaGroupMap.set(u.ctaSlug, []);
    }
    const posts = ctaGroupMap.get(u.ctaSlug)!;
    if (!posts.includes(u.pageUrl)) {
      posts.push(u.pageUrl);
    }
  });

  ctaGroupMap.forEach((posts, slug) => {
    ctaGroups.push({ slug, name: ctaMap[slug] || slug, posts });
  });
  ctaGroups.sort((a, b) => b.posts.length - a.posts.length);

  // Filter
  const filteredPosts = postGroups.filter((p) =>
    p.pageUrl.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCtas = ctaGroups.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="empty-state"><p>Loading posts library...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Posts Library</h1>
          <p>Bidirectional view of CTAs and articles</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${view === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('posts')}
        >
          Posts → CTAs
        </button>
        <button
          className={`btn btn-sm ${view === 'ctas' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('ctas')}
        >
          CTAs → Posts
        </button>
        <input
          className="form-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {view === 'posts' ? (
        <>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {filteredPosts.length} pages with CTAs detected
          </p>
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <h3>No posts detected</h3>
              <p>CTAs will appear here once they&apos;re loaded on live pages</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Locale</th>
                  <th>CTAs</th>
                  <th>Last Seen</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((p) => (
                  <tr key={p.pageUrl}>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={p.pageUrl} target="_blank" rel="noopener">{p.pageUrl}</a>
                    </td>
                    <td>{p.locale?.toUpperCase()}</td>
                    <td>
                      {p.ctas.map((slug) => (
                        <Link
                          key={slug}
                          href={`/admin/ctas/${slug}`}
                          className="badge badge-global"
                          style={{ marginRight: '4px', textDecoration: 'none' }}
                        >
                          {ctaMap[slug] || slug}
                        </Link>
                      ))}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(p.lastSeenAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setPreviewUrl(`${p.pageUrl}?admin-preview=true`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {filteredCtas.length} CTAs with tracked usage
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>CTA</th>
                <th>Slug</th>
                <th>Used In</th>
                <th>Pages</th>
              </tr>
            </thead>
            <tbody>
              {filteredCtas.map((c) => (
                <tr key={c.slug}>
                  <td>
                    <Link href={`/admin/ctas/${c.slug}`} style={{ fontWeight: 600 }}>{c.name}</Link>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent)' }}>
                    {c.slug}
                  </td>
                  <td>
                    <strong>{c.posts.length}</strong> pages
                  </td>
                  <td style={{ maxWidth: '400px' }}>
                    {c.posts.slice(0, 3).map((url) => (
                      <div key={url} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {url}
                      </div>
                    ))}
                    {c.posts.length > 3 && (
                      <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
                        +{c.posts.length - 3} more
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Preview Panel */}
      {previewUrl && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '50%',
          background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Page Preview</span>
            <button className="btn btn-sm btn-secondary" onClick={() => setPreviewUrl('')}>Close ×</button>
          </div>
          <iframe
            src={previewUrl}
            style={{ flex: 1, width: '100%', border: 'none' }}
            title="Page Preview"
          />
        </div>
      )}
    </div>
  );
}
