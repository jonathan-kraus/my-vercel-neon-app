import { z } from 'zod';

export const LoggerSchema = z.object({
  severity: z.enum(['info', 'warn', 'error']),
  source: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  metadata: z.any().optional(),
});

export type LoggerData = z.infer<typeof LoggerSchema>;
