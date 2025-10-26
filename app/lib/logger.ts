import { db } from '../lib/db';
import { LogPayload } from '../lib/types';
const baseUrl =
  (typeof window !== 'undefined' && window.location.origin) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.kraus.my.id';
export async function logger(payload: LogPayload) {
  if (typeof window === 'undefined') {
    // ✅ Server-side: use Prisma
    await db.log.create({ data: payload });
  } else {
    // ✅ Client-side: call API
    await fetch(`${baseUrl}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}
