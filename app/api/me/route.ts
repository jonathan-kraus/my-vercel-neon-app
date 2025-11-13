import { NextResponse } from 'next/server';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';
import { db } from '@/app/lib/db';
//import { cookies } from 'next/headers';

function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

function decodeJwtPayload(
  token: string | undefined | null,
  requestId: string
): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const log = createLogger('app/api/me/route.ts', requestId);
    log.info(`[app/api/me/route.ts]  Decoding JWT payload`, { Metadata: parts[1] });
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '==='.slice((payload.length + 3) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
function getCookie(name: string): string | null {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

export async function GET(req: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/me/route.ts', requestId);

  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const val = cookies['val'];

  if (val === 'init') {
    await log.info('Handling GET request', {
      action: 'GET',
      timestamp: new Date().toISOString(),
      hasCookies: !!req.headers.get('cookie'),
    });
  }

  try {
    const token =
      cookies['token'] ??
      cookies['auth'] ??
      cookies['session'] ??
      cookies['next-auth.session-token'] ??
      cookies['__session'];

    let username: string | null = null;
    let expiresAt: number | null = null;

    const payload = decodeJwtPayload(token, requestId);

    if (payload) {
      const nameVal = typeof payload['name'] === 'string' ? payload['name'] : undefined;
      const usernameVal = typeof payload['username'] === 'string' ? payload['username'] : undefined;
      const subVal = typeof payload['sub'] === 'string' ? payload['sub'] : undefined;
      const expRaw = payload['exp'];
      log.info('Decoded JWT payload', { payload });
      let expNum: number | undefined;
      if (typeof expRaw === 'number') expNum = expRaw;
      else if (typeof expRaw === 'string' && !Number.isNaN(Number(expRaw))) expNum = Number(expRaw);

      username = nameVal ?? usernameVal ?? subVal ?? null;
      if (expNum) expiresAt = expNum * 1000;
    }

    if (payload?.['sub'] && !username) {
      try {
        let subIdNum: number | undefined;
        if (typeof payload['sub'] === 'number') {
          subIdNum = payload['sub'];
        } else if (typeof payload['sub'] === 'string' && !Number.isNaN(Number(payload['sub']))) {
          subIdNum = Number(payload['sub']);
        }

        if (typeof subIdNum === 'number') {
          const user = await db.user.findUnique({
            where: { id: subIdNum },
            select: { name: true },
          });
          if (user?.name) username = user.name;
        }
      } catch (e) {
        log.error('db lookup failed in /api/me', { error: String(e) });
      }
    }

    if (!expiresAt && cookies['expires_at']) {
      const parsed = Number(cookies['expires_at']);
      if (!Number.isNaN(parsed)) expiresAt = parsed;
    }
    if (val === 'init') {
      await log.info('Completed GET request', {
        action: 'GET_complete',
        timestamp: new Date().toISOString(),
      });
    }
    const response = NextResponse.json({ username, expiresAt });

    // If val was 'init', update it to 'used'
    if (val === 'init') {
      response.headers.set('Set-Cookie', 'val=used; path=/; max-age=6400; SameSite=Lax');
    }

    return response;
  } catch (err) {
    await log.error('Error determining session', { error: String(err) });
    return NextResponse.json({ error: 'failed to determine session' }, { status: 500 });
  }
}
