import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.CTA_ADMIN_PASSWORD || 'changeme';

/**
 * Simple password-gate middleware for admin routes.
 * Checks for a session cookie or Authorization header.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  // Check session cookie first
  const sessionCookie = request.cookies.get('cta-admin-session');
  if (sessionCookie?.value === getSessionToken()) {
    return null; // Authenticated
  }

  // Check Authorization header (for API calls from admin UI)
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    return null; // Authenticated
  }

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Generates a deterministic session token from the password.
 * In production, use a proper session mechanism.
 */
function getSessionToken(): string {
  // Simple hash of password for session token
  let hash = 0;
  const str = `cta-admin-${ADMIN_PASSWORD}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `session_${Math.abs(hash).toString(36)}`;
}

export function getSessionCookieValue(): string {
  return getSessionToken();
}

export { ADMIN_PASSWORD };
