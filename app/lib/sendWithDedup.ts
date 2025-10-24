import { db } from './db';

export type SendWithDedupOptions = {
  source: string; // module name
  message: string; // human message for the log
  requestId?: string;
  throttleMinutes?: number; // minutes to suppress duplicate sends
  sendFn: () => Promise<unknown>; // function that actually sends the email
};

export async function sendWithDedup(opts: SendWithDedupOptions) {
  const {
    source,
    message,
    requestId,
    throttleMinutes, // may be undefined
    sendFn,
  } = opts;

  // Allow overriding default via environment variable
  const envthrottle = process.env.EMAIL_THROTTLE_MINUTES;
  const effectiveThrottle: number = envthrottle ? parseInt(envthrottle, 10) : 15;
console.log(`[${requestId}] [sendWithDedup] effectiveThrottle set to ${effectiveThrottle} minutes`);    
console.log(`[${requestId}] [sendWithDedup] throttleMinutes set to ${throttleMinutes} minutes`);    

  const now = new Date();

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
    console.log(`[${requestId}] [sendWithDedup] Minutes since last "${message}": ${minutesSince}`); 
    const isNew = message.includes('New Post Created'); // allow immediate send for new post emails 
    if (!isNew && minutesSince < effectiveThrottle) {
      // Suppress
      const suppressedMessage = `Email suppressed: ${message}
      (last sent ${Math.round(minutesSince)} minutes ago
        throttle: ${effectiveThrottle} mins)`;
      await db.log.create({
        data: {
          severity: 'info',
          source,
          message: suppressedMessage,
          requestId,
          metadata: { action: 'throttle', minutesSince: Math.round(minutesSince) },
          timestamp: new Date(),
        },
      });

      return { sent: false, reason: 'throttled', minutesSince: Math.round(minutesSince) };
    }

    // Otherwise send
    await sendFn();

    // record sent
    const sentMessage = `${message} - email sent`;
    await db.log.create({
      data: {
        severity: 'info',
        source,
        message: sentMessage,
        requestId,
        metadata: { action: 'sent' },
        timestamp: new Date(),
      },
    });

    return { sent: true };
  } catch (err) {
    // Log the failure but don't throw to caller
    try {
      await db.log.create({
        data: {
          severity: 'error',
          source,
          message: `Email send failure: ${message}`,
          requestId,
          metadata: { action: 'error', error: (err as Error)?.message ?? String(err) },
          timestamp: new Date(),
        },
      });
    } catch (logErr) {
      // swallow
      console.error('Failed to write error log for sendWithDedup:', logErr);
    }

    return { sent: false, reason: 'error', error: (err as Error)?.message ?? String(err) };
  }
}
