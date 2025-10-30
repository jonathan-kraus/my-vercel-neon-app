import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Dev-only helper to set a client-visible session cookie and redirect to '/'
// Usage: /dev/set-session?user=Jonathan
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const user = url.searchParams.get('user') || 'Jonathan';
  const maxAge = 60 * 60; // 1 hour (seconds)
  const expiresAt = Date.now() + maxAge * 1000;

  const res = NextResponse.redirect(new URL('/', req.url));

  // Use encodeURIComponent to safely handle spaces/special chars in cookie value
  res.cookies.set('username', encodeURIComponent(user), {
    path: '/',
    maxAge,
    sameSite: 'lax',
  });

  res.cookies.set('expires_at', String(expiresAt), {
    path: '/',
    maxAge,
    sameSite: 'lax',
  });

  return res;
}
