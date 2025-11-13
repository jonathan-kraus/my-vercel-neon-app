import type { EmailData } from '@/app/lib/schemas/email';
import { EmailSchema } from '@/app/lib/schemas/email';
import { createLogger } from './logger';
import { generateUUID } from '@/uuidj';

export async function sendConfirmationEmail(
  data: EmailData
): Promise<{ success: boolean; message: string }> {
  const requestId = data.requestId || generateUUID();
  const log = createLogger('app/utils/email-client.ts', requestId);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    const parsed = EmailSchema.safeParse(data);

    if (!parsed.success) {
      await log.error('Invalid email payload', { errors: parsed.error.format() });
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

      const result = sent
        ? { success: true, message: 'sent (server util)' }
        : { success: false, message: 'skipped (server util)' };

      await log.info('Email sent via server util', {
        success: result.success,
        message: result.message,
        recipient: data.toEmail,
      });

      return result;
    }
    // This code assumes it is inside an async function like sendEmailClient(data, baseUrl)

    // ... setup (url, fetch call) ...
    const url = `${baseUrl || 'https://www.kraus.my.id'}/api/send-email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Use a variable to store the ultimate result object
    let result: { success: boolean; message: string };

    // =========================================================
    // ✅ FIX: SUCCESS PATH (The response status is 200-299)
    // =========================================================
    if (response.ok) {
      // We expect a successful response body to be JSON
      try {
        // Read body ONCE (as JSON) for the success path
        const successJson = await response.json();

        if (successJson.status === 'success' || successJson.status === 'skipped') {
          result = { success: true, message: successJson.message || 'Email action completed.' };
          await log.info('Email API success', {
            status: successJson.status,
            apiMessage: successJson.message,
          });
        } else {
          result = {
            success: false,
            message: successJson.message || 'Unexpected successful API response.',
          };
          await log.warn('Unexpected 200 response', { response: successJson });
        }
      } catch (e) {
        result = {
          success: false,
          message: 'Received successful status, but response was not valid JSON.',
        };
        await log
          .error('200 status JSON parse failed', {
            error: e instanceof Error ? e.message : String(e),
          })
          .catch(() => console.warn('[email-client] Failed to log parse error'));
      }

      // =========================================================
      // ✅ FIX: ERROR PATH (The response status is 4xx or 5xx)
      // =========================================================
    } else {
      // 1. Read the body ONCE as text for the error path
      const errorBodyAsText = await response.text();

      if (errorBodyAsText.includes('Vercel Security Checkpoint')) {
        result = { success: false, message: 'Request blocked by Vercel Security Checkpoint.' };
        await log
          .error('Vercel security blocked', {
            preview: errorBodyAsText.slice(0, 200),
          })
          .catch(() => console.warn('[email-client] Failed to log security block'));
      } else {
        try {
          const errorJson = JSON.parse(errorBodyAsText);
          result = {
            success: false,
            message: errorJson.message || `API Error: ${response.status}`,
          };
        } catch (_e) {
          result = {
            success: false,
            message: `Server error (${response.status}): ${errorBodyAsText.slice(0, 50)}...`,
          };
        }
        await log
          .error('Email API error', {
            status: response.status,
            message: result.message,
          })
          .catch(() => console.warn('[email-client] Failed to log API error'));
      }
    }

    return result;
  } catch (error) {
    await log
      .error('Exception in sendConfirmationEmail', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      .catch(() => console.warn('[email-client] Failed to log exception'));
    return { success: false, message: 'Exception occurred while sending email' };
  }
}
