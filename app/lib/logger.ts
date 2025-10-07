// lib/logger.ts
import { db } from '@/lib/db' // Prisma client

export async function logEvent({
  userId,
  severity = 'info',
  module,
  requestId,
  message,
  metadata = {},
}: {
  userId?: string
  severity?: 'info' | 'warn' | 'error' | 'debug'
  module: string
  requestId?: string
  message: string
  metadata?: Record<string, any>
}) {
  try {
    await db.log.create({
      data: {
        userId,
        severity,
        module,
        requestId,
        message,
        metadata,
        timestamp: new Date(),
      },
    })
  } catch (err) {
    console.error('Failed to log event:', err)
  }
}
