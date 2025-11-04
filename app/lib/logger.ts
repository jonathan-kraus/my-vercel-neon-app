import { db } from '../lib/db';
import { LogPayload } from '../lib/types';

export async function logger(payload: LogPayload) {
  if (typeof window === 'undefined') {
    // ✅ Server-side: use Prisma directly
    await db.log.create({ data: payload });
    return;
  }

  // ✅ Client-side: same-origin API with credentials
  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    (typeof window !== 'undefined' && window.location.origin) ||
    'http://localhost:3000';

  await fetch(`${baseUrl}/api/log`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
