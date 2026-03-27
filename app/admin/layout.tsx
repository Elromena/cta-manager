'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if session cookie exists (simple client-side check)
    const hasSession = document.cookie.includes('cta-admin-session');
    setAuthenticated(hasSession);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/cta-admin/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Connection error');
    }
  };

  // Loading state
  if (authenticated === null) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Login gate
  if (!authenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>CTA Manager</h1>
          <p>Enter the admin password to continue</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/ctas', label: 'CTAs' },
    { href: '/admin/posts', label: 'Posts Library' },
    { href: '/admin/templates', label: 'Templates' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/docs', label: 'Docs' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>CTA Manager</h2>
          <span>Blockchain-Ads</span>
        </div>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={pathname === item.href ? 'active' : ''}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
