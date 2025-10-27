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

        // Assuming your API returns { status: 'success', message: 'Email sent' }
        if (successJson.status === 'success' || successJson.status === 'skipped') {
          result = { success: true, message: successJson.message || 'Email action completed.' };
          console.log('[email-client] Success/Skipped response:', successJson);
        } else {
          // Handle unexpected 200 response structure
          result = {
            success: false,
            message: successJson.message || 'Unexpected successful API response.',
          };
          console.warn('[email-client] Unexpected 200 JSON:', successJson);
        }
      } catch (e) {
        // This catches cases where the API returns 200 but sends non-JSON (like your Vercel HTML, though less likely here)
        result = {
          success: false,
          message: 'Received successful status, but response was not valid JSON.',
        };
        console.error('[email-client] 200 Status, but JSON parsing failed.', e);
      }

      // =========================================================
      // ✅ FIX: ERROR PATH (The response status is 4xx or 5xx)
      // =========================================================
    } else {
      // 1. Read the body ONCE as text for the error path
      const errorBodyAsText = await response.text();

      // Check for Vercel Security Checkpoint HTML
      if (errorBodyAsText.includes('Vercel Security Checkpoint')) {
        result = { success: false, message: 'Request blocked by Vercel Security Checkpoint.' };
        console.error('[email-client] Vercel Security Blocked:', errorBodyAsText.slice(0, 200));
      } else {
        // Try to parse the error text as JSON to get a clean message
        try {
          const errorJson = JSON.parse(errorBodyAsText);
          // Assuming your API error format is { message: '...' }
          result = {
            success: false,
            message: errorJson.message || `API Error: ${response.status}`,
          };
        } catch (e) {
          // If it fails to parse (generic text error), use a generic message
          result = {
            success: false,
            message: `Server error (${response.status}): ${errorBodyAsText.slice(0, 50)}...`,
          };
        }
        console.error('[email-client] API Error:', result.message);
      }
    }

    // Final Return
    return result;
    // } <-- close the async function
  } catch (error) {
    console.error('[email-client] Exception in sendConfirmationEmail:', error);
    return { success: false, message: 'Exception occurred while sending email' };
  }
}
