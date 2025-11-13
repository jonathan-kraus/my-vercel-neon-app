import { db } from './db';
import { createLogger } from '../utils/logger';

export type SendWithDedupOptions = {
  source: string; // module name
  message: string | number | Record<string, unknown>; // human message for the log
  requestId?: string;
  throttleMinutes?: number; // minutes to suppress duplicate sends
  sendFn: () => Promise<unknown>; // function that actually sends the email
};

export async function sendWithDedup(opts: SendWithDedupOptions) {
  const { source, message, requestId, sendFn } = opts;

  // Allow overriding default via environment variable
  const envthrottle = process.env.EMAIL_THROTTLE_MINUTES;
  const effectiveThrottle: number = envthrottle ? parseInt(envthrottle, 10) : 15;

  const now = new Date();

  function safeSerialize(obj: unknown) {
    // If it's an Error, capture useful fields.
    if (obj instanceof Error) {
      const errorObj: any = { name: obj.name, message: obj.message, stack: obj.stack };
      // Add additional diagnostics if available
      if ('code' in obj && obj.code) errorObj.code = obj.code;
      if ('status' in obj && obj.status) errorObj.status = obj.status;
      if ('statusText' in obj && obj.statusText) errorObj.statusText = obj.statusText;
      if ('response' in obj && obj.response) {
        // For HTTP errors (e.g., from axios or similar), serialize the response
        try {
          errorObj.response = safeSerialize(obj.response);
        } catch {
          errorObj.response = '[Error serializing response]';
        }
      }
      return errorObj;
    }

    // Try JSON-safe serialization with circular protection.
    const seen = new Set<any>();
    try {
      return JSON.parse(
        JSON.stringify(obj, (_key, value) => {
          if (typeof value === 'bigint') return String(value);
          if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
          if (value && typeof value === 'object') {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
          }
          return value;
        })
      );
    } catch {
      // Fallback to string representation
      try {
        return String(obj);
      } catch {
        return '[Unserializable]';
      }
    }
  }

  const safeMessage = String(message);

  try {
    // Find the most recent 'email sent' log for this source and message
    const recent = await db.log.findFirst({
      where: {
        source,
        //message: { contains: message, mode: 'insensitive' }, // timer per component
        message: { contains: 'email sent', mode: 'insensitive' },
      },
      orderBy: { timestamp: 'desc' },
    });

    const minutesSince = recent ? (now.getTime() - recent.timestamp.getTime()) / 60000 : Infinity;

    await log.info('Checking email throttle', {
      safeMessage,
      minutesSince: Math.round(minutesSince),
      effectiveThrottle,
    });
    const isNew = safeMessage.includes('Post:'); // allow immediate send for new post emails
    if (!isNew && minutesSince < effectiveThrottle) {
      // Suppress
      const suppressedMessage = `Email suppressed: ${safeMessage}
      (last sent ${Math.round(minutesSince)} minutes ago
        throttle: ${effectiveThrottle} mins)`;
      const log = createLogger(source, requestId);
      await log.info(suppressedMessage, {
        action: 'throttle',
        minutesSince: Math.round(minutesSince),
      });

      return { sent: false, reason: 'throttled', minutesSince: Math.round(minutesSince) };
    }

    // Otherwise send
    await sendFn();

    // record sent
    const sentMessage = `${safeMessage} - email sent`;
    const log = createLogger(source, requestId);
    await log.info(sentMessage, { action: 'sent' });

    return { sent: true };
  } catch (err) {
    // Log the failure but don't throw to caller
    try {
      const log = createLogger(source, requestId);
      await log.error(`Email send failure: ${safeMessage}`, {
        action: 'error',
        error: safeSerialize(err),
      });
    } catch (logErr) {
      // Fallback if logging fails
      console.warn('[sendWithDedup] Failed to log error:', logErr);
    }

    return { sent: false, reason: 'error', error: safeSerialize(err) };
  }
}
