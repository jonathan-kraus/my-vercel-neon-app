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
  let baseUrl: string;

  if (process.env.NODE_ENV === 'development') {
    // In development, always use localhost
    baseUrl = 'http://localhost:3000';
  } else {
    // In production, use Vercel URL or window origin
    baseUrl =
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      (typeof window !== 'undefined' && window.location.origin) ||
      'http://localhost:3000';
  }

  const fullUrl = `${baseUrl}/api/log`;

  await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enriched),
  });
}

export const createLogger = (source: string, requestId?: string) => {
  return {
    info: (message: string, metadata?: Record<string, any>) =>
      logger({ severity: 'info', source, message, requestId, metadata }),

    warn: (message: string, metadata?: Record<string, any>) =>
      logger({ severity: 'warning', source, message, requestId, metadata }),

    error: (message: string, metadata?: Record<string, any>) =>
      logger({ severity: 'error', source, message, requestId, metadata }),
  };
};
