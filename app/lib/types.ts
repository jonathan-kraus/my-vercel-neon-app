// lib/types.ts
export type LogEvent = {
  severity: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
  requestId?: string
  metadata?: Record<string, unknown>
}
