import { db } from '../lib/db';
import { LogPayload } from '../lib/types';

export async function logger(payload: LogPayload) {
  if (typeof window === 'undefined') {
    // ✅ Server-side: use Prisma directly
    await db.log.create({ data: payload });
    return;
  }

  // ✅ Client-side: same-origin API with credentials
  await fetch(`/api/log`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
