interface EmailData {
  toEmail: string;
  toName: string;
  subject: string;
  requestId?: string;
}
console.log('[email-client] sendConfirmationEmail function defined'); 
export async function sendConfirmationEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    // If running server-side without a configured public site URL, call server util directly
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;

    if (typeof window === 'undefined' && !baseUrl) {
      // dynamic import the server utility to avoid circular deps at module load
      const mod = await import('@/app/utils/sendemail');
      // sendConfirmationEmail exported from server util returns boolean/true on success
      const sent = await mod.sendConfirmationEmail(data.toEmail, data.toName, data.requestId, data.subject);
      return sent ? { success: true, message: 'sent (server util)' } : { success: false, message: 'skipped (server util)' };
    }

    const url = `${baseUrl || 'https://www.kraus.my.id'}/api/send-email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the data to the API Route Handler
      body: JSON.stringify(data),
    });

    let result: unknown = null;
    try {
      result = await response.json();
    } catch {
      // Non-JSON response (HTML) — treat as failure but include raw text
      const text = await response.text();
      console.error('[email-client] Non-JSON response from API:', text.slice(0, 200));
      return { success: false, message: 'Invalid non-JSON response from email API' };
    }

    if (!response.ok) {
      const msg = (result && typeof result === 'object' && 'message' in result) ? (result as unknown as { message?: string }).message : undefined;
      console.error('API Error:', msg);
      return { success: false, message: msg || 'API request failed' };
    }

    const successMsg = (result && typeof result === 'object' && 'message' in result) ? (result as unknown as { message?: string }).message : undefined;
    return { success: true, message: successMsg ?? 'OK' };
  } catch (error) {
    console.error('Network Error:', error);
    return { success: false, message: 'A network error occurred' };
  }
}