import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword, getSessionCookieValue } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Validates admin password and sets session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== getAdminPassword()) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set('cta-admin-session', getSessionCookieValue(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
