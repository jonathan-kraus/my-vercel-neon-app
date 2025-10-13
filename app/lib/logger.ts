import { db } from './db'
import type { LogEvent } from './types'

export async function logEvent(event: LogEvent) {
  const {
    severity = 'info',
    source,
    requestId,
    message,
    metadata = {},
  } = event
console.log(`[logEvent] [${requestId}] Logging:`, { source, message, metadata });

  try {
    await db.log.create({
      data: {
        severity,
        source,
        requestId,
        message,
        metadata: metadata ?? {}, // ensures it's never null
        timestamp: new Date(),
      },
    })
  } catch (err) {
    console.error('Failed to log event:', err)
  }
}
