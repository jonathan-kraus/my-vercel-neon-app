import { z } from 'zod';

export const LogPayloadSchema = z.object({
  severity: z.enum(['info', 'warn', 'error', 'debug']).default('info'),
  source: z.string(),
  message: z.string(),
  requestId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
