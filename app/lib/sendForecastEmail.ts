'use server';
import { DailyForecastPoint } from './GetDailyForecast';
export async function sendForecastEmail(forecast: DailyForecastPoint[], requestId: string) {
  if (!forecast || forecast.length === 0) return;

  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  try {
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: 'jonathanckraus@gmail.com',
        toName: 'Jonathan',
        subject: `Forecast Report - ${new Date().toISOString()}`,
        message: `Forecast Report: ${JSON.stringify(forecast, null, 2)}`,
        requestId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    console.error(`[${requestId}] ❌ Email send failed:`, err);
  }
}
