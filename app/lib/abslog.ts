// lib/abslog.ts
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
  try {
    if (typeof window === 'undefined') {
      await db.log.create({ data: { severity, source, message, requestId, metadata } as any });
    } else {
      await fetch(`/api/log`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity, source, message, requestId, metadata }),
      });
    }
  } catch (err) {
    console.error(`[${source}] [${requestId}] Failed to log event: using abslog`, err);
  }
}
