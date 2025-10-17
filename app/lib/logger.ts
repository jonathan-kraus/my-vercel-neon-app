import { db } from '../lib/db';
import { LogPayload } from '../lib/types';
export async function logEvent(payload: LogPayload) {
  if (typeof window === 'undefined') {
    // ✅ Server-side: use Prisma
    await db.log.create({ data: payload });
  } else {
    // ✅ Client-side: call API
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}
