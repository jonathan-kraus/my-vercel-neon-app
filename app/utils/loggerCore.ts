// utils/loggerCore.ts
import { db } from '@/app/lib/db';
import type { LogPayload } from '@/app/lib/types';

function enrichMetadata(metadata?: Record<string, any>) {
  const base: Record<string, any> = {};
  if (typeof window !== 'undefined') {
    base.userAgent = navigator.userAgent;
    base.pathname = window.location.pathname;
  } else {
    base.timestamp = new Date().toISOString();
  }
  return { ...base, ...metadata };
}

export async function logger(payload: LogPayload) {
  const enriched: LogPayload = { ...payload, metadata: enrichMetadata(payload.metadata) };

  if (typeof window === 'undefined') {
    await db.log.create({ data: enriched });
    return;
  }

  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    (typeof window !== 'undefined' && window.location.origin) ||
    'http://localhost:3000';

  await fetch(`${baseUrl}/api/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enriched),
  });
}
