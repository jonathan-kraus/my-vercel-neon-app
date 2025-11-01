'use client';

import { useEffect, useRef, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { sendForecastEmail } from '@/app/lib/sendForecastEmail';

type ForecastStatusProps = {
  forecast: DailyForecastPoint[];
};

export default function ForecastStatus({ forecast }: ForecastStatusProps) {
  const emailSentRef = useRef(false);
  const requestIdRef = useRef<string>(crypto.randomUUID());

  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000';

  const logEvent = useCallback(
    async (severity: 'info' | 'error', message: string, metadata: Record<string, any> = {}) => {
      try {
        await fetch(`${baseUrl}/api/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            severity,
            source: 'ForecastStatus',
            message,
            requestId: requestIdRef.current,
            metadata,
          }),
        });
      } catch (err) {
        console.error('Failed to log event:', err);
      }
    },
    [baseUrl]
  );

  const handleSendEmail = useCallback(async () => {
    if (!forecast || forecast.length === 0) {
      toast.error('Forecast not loaded yet');
      return;
    }

    try {
      await sendForecastEmail(forecast, requestIdRef.current);
      toast.success('Forecast email sent!');
      await logEvent('info', 'Forecast email sent successfully', {
        forecastLength: forecast.length,
      });
    } catch (err) {
      console.error('Failed to send forecast email:', err);
      toast.error('Failed to send forecast email');
      await logEvent('error', 'Forecast email failed', { error: String(err) });
    }
  }, [forecast, logEvent]);

  // Auto-send once after forecast loads
  useEffect(() => {
    if (forecast && forecast.length > 0 && !emailSentRef.current) {
      emailSentRef.current = true;
      handleSendEmail();
    }
  }, [forecast, handleSendEmail]);

  if (!forecast || forecast.length === 0) return <p>Loading forecast...</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">7-Day Forecast (Email + Logs)</h2>

      <ul className="space-y-2">
        {forecast.map((day) => (
          <li key={day.time} className="border p-2 rounded">
            <strong>{new Date(day.time).toLocaleDateString()}</strong> — High: {day.temperatureMax}
            °F, Low: {day.temperatureMin}°F, Rain: {day.rainAccumulationSum} in
          </li>
        ))}
      </ul>

      <button onClick={handleSendEmail} className="px-3 py-1 bg-blue-500 text-white rounded">
        Send Forecast Email
      </button>

      <Toaster />
    </div>
  );
}
