import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

function decodeJwtPayload(token: string | undefined | null) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '==='.slice((payload.length + 3) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);

    const token =
      cookies['token'] ??
      cookies['auth'] ??
      cookies['session'] ??
      cookies['next-auth.session-token'] ??
      cookies['__session'];

    let username: string | null = null;
    let expiresAt: number | null = null;

    const payload: any | null = decodeJwtPayload(token);

    if (payload) {
      username = payload.name ?? payload.username ?? payload.sub ?? null;
      if (payload.exp) expiresAt = Number(payload.exp) * 1000;
    }

    if (payload?.sub && !username) {
      const prisma = new PrismaClient();
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { username: true },
        });
        if (user?.username) username = user.username;
      } catch (e) {
        console.error('prisma lookup failed in /api/me', e);
      }
    }

    if (!expiresAt && cookies['expires_at']) {
      const parsed = Number(cookies['expires_at']);
      if (!Number.isNaN(parsed)) expiresAt = parsed;
    }

    return NextResponse.json({ username, expiresAt });
  } catch (err) {
    console.error('/api/me error', err);
    return NextResponse.json({ error: 'failed to determine session' }, { status: 500 });
  }
}