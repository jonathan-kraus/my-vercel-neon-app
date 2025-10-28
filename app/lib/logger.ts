import { db } from '../lib/db';
import { LogPayload } from '../lib/types';
import { z } from 'zod';
export const LogPayloadSchema = z.object({
  severity: z.enum(['info', 'warn', 'error', 'debug']).default('info'),
  source: z.string(),
  message: z.string(),
  requestId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

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
