// utils/logger.ts
import { db } from '@/app/lib/db';

export type LogPayload = {
  severity: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  requestId?: string;
  metadata?: Record<string, any>;
};

function enrichMetadata(metadata?: Record<string, any>) {
  const base: Record<string, any> = {};

  if (typeof window !== 'undefined') {
    // Client-side extras
    base.userAgent = navigator.userAgent;
    base.pathname = window.location.pathname;
  } else {
    // Server-side extras
    base.timestamp = new Date().toISOString();
  }

  return { ...base, ...metadata };
}

export async function logger(payload: LogPayload) {
  const enriched: LogPayload = {
    ...payload,
    metadata: enrichMetadata(payload.metadata),
  };

  if (typeof window === 'undefined') {
    // ✅ Server-side: write directly to DB
    await db.log.create({ data: enriched });
    return;
  }

  // ✅ Client-side: forward to API route
  await fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enriched),
  });
}

// Convenience helper for your 90% case
export const logInfoFactory = (source: string) => {
  return (message: string, metadata?: Record<string, any>, requestId?: string) =>
    logger({ severity: 'info', source, message, requestId, metadata });
};
