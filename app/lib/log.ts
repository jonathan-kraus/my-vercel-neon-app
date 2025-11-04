// lib/log.ts
import { db } from '@/app/lib/db';
type LogMetadata = Record<string, unknown>;

export async function logEvent({
  severity = 'info',
  source,
  message,
  requestId,
  metadata = {},
}: {
  severity?: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  requestId: string;
  metadata?: LogMetadata;
}) {
  console.log('log module loaded', { requestId });
  try {
    if (typeof window === 'undefined') {
      await db.log.create({ data: { severity, source, message, requestId, metadata } as any });
    } else {
      const baseUrl =
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        (typeof window !== 'undefined' && window.location.origin) ||
        'http://localhost:3000';

      await fetch(`${baseUrl}/api/log`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity, source, message, requestId, metadata }),
      });
    }
  } catch (err) {
    console.error(`[${source}] [${requestId}] Failed to log event:`, err);
  }
}
