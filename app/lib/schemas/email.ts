import { z } from 'zod';

export const EmailSchema = z.object({
  toEmail: z.string().email(),
  toName: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().optional(),
  requestId: z.string().optional(),
});

export type EmailData = z.infer<typeof EmailSchema>;
