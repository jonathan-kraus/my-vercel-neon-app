// lib/log.ts
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
  console.log("log module loaded", {requestId});
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kraus.my.id';
  try {
    await fetch(`${baseUrl}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity, source, message, requestId, metadata }),
    });
  } catch (err) {
    console.error(`[${source}] [${requestId}] Failed to log event:`, err);
  }
}
