'use server';
import { DailyForecastPoint } from './GetDailyForecast';
import { createLogger } from '../utils/logger';

export async function sendForecastEmail(forecast: DailyForecastPoint[], requestId: string) {
  if (!forecast || forecast.length === 0) return;

  const log = createLogger('app/lib/sendForecastEmail.ts');
  await log.info('Sending forecast email', {
    forecastLength: forecast.length,
  });

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

    await log.info('Forecast email sent successfully');
  } catch (err) {
    await log
      .error('Email send failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      .catch(() => {
        // Fallback if logging fails
        console.warn('[sendForecastEmail] Failed to log error:', err);
      });
  }
}
