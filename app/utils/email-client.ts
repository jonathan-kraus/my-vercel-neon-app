import type { EmailData } from '@/app/lib/schemas/email';
import { EmailSchema } from '@/app/lib/schemas/email';
import { parse } from 'path';
console.log('[email-client] sendConfirmationEmail function defined');
export async function sendConfirmationEmail(
  data: EmailData
): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    const parsed = EmailSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Invalid email payload:', parsed.error);
      return { success: false, message: 'Invalid payload' };
    }

    if (typeof window === 'undefined' && !baseUrl) {
      const mod = await import('@/app/utils/sendemail');
      const sent = await mod.sendEmailDirect(
        data.toEmail,
        data.toName,
        data.requestId,
        data.subject
      );

      // ✅ FIX: Assign the resulting object to a variable first
      const result = sent
        ? { success: true, message: 'sent (server util)' }
        : { success: false, message: 'skipped (server util)' };

      // ✅ FIX: Log the variables from the 'result' object
      console.log('[email-client] Sending email via API:', result.success, result.message);

      // ✅ FIX: Now return the variable
      return result;
    }
    const url = `${baseUrl || 'https://www.kraus.my.id'}/api/send-email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    let result: { message?: string } | null = null;
    const errorBodyAsText = await response.text();
    try {
      const errorJson = JSON.parse(errorBodyAsText);
      throw new Error(errorJson.message);
    } catch (parseError) {
      console.error('[email-client] Non-JSON response from API:', errorBodyAsText.slice(0, 200));
      throw new Error(errorBodyAsText);
    }
  } catch (error) {
    console.error('[email-client] Network Error:', error);
    return { success: false, message: 'A network error occurred' };
  }
}
