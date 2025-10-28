import { db } from '../lib/db';
import { LogPayloadSchema } from '../lib/schemas/loggerSchema';

const baseUrl =
  (typeof window !== 'undefined' && window.location.origin) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.kraus.my.id';
export async function logger(payload: unknown) {
  const result = LogPayloadSchema.safeParse(payload);
  if (result.success) {
    console.log('[logger] Valid log payload:', result.data);
  } else {
    console.warn('[logger] Invalid log payload:', result.error.format());
    return;
  }

  const validPayload = result.data;

  if (typeof window === 'undefined') {
    await db.log.create({ data: validPayload });
  } else {
    await fetch(`${baseUrl}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
  }
}
