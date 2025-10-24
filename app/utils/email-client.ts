import type { EmailData } from '@/app/lib/schemas/email';
import { EmailSchema } from '@/app/lib/schemas/email';
console.log('[email-client] sendConfirmationEmail function defined');
export async function sendConfirmationEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    const parsed = EmailSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Invalid email payload:', parsed.error);
      return { success: false, message: 'Invalid payload' };
    }

    if (typeof window === 'undefined' && !baseUrl) {
      const mod = await import('@/app/utils/sendemail');
      const sent = await mod.sendConfirmationEmail(
        data.toEmail,
        data.toName,
        data.requestId,
        data.subject
      );
      return sent
        ? { success: true, message: 'sent (server util)' }
        : { success: false, message: 'skipped (server util)' };
    }

    const url = `${baseUrl || 'https://www.kraus.my.id'}/api/send-email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    let result: { message?: string } | null = null;

    try {
      result = await response.json();
    } catch {
      const text = await response.text();
      console.error('[email-client] Non-JSON response from API:', text.slice(0, 200));
      return { success: false, message: 'Invalid non-JSON response from email API' };
    }

    if (!response.ok) {
      console.error('API Error:', result?.message);
      return { success: false, message: result?.message ?? 'API request failed' };
    }

    return { success: true, message: result?.message ?? 'OK' };
  } catch (error) {
    console.error('[email-client] Network Error:', error);
    return { success: false, message: 'A network error occurred' };
  }
}
