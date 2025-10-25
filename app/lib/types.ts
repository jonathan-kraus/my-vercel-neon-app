import { Prisma } from '@prisma/client';

// lib/types.ts
export type LogEvent = {
  severity: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  requestId?: string;
  metadata?: Prisma.JsonValue;
};

export type LogRow = LogEvent & {
  id: string;
  timestamp: string;
};

export type LogPayload = {
  severity: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  requestId?: string;
  metadata?: Record<string, string>;
};
