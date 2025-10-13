// lib/abslog.ts
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
    await fetch('https://kraus.my.id/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity, source, message, requestId, metadata }),
    });
  } catch (err) {
    console.error(`[${source}] [${requestId}] Failed to log event: using abslog`, err);
  }
}
