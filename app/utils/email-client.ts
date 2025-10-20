interface EmailData {
  toEmail: string;
  toName: string;
  subject: string;
  requestId?: string;
}

export async function sendConfirmationEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the data to the API Route Handler
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('API Error:', result.message);
      return { success: false, message: result.message || 'API request failed' };
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error('Network Error:', error);
    return { success: false, message: 'A network error occurred' };
  }
}