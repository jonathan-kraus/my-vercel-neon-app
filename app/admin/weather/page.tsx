'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { sendForecastEmail } from '@/app/lib/sendForecastEmail';

type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function WeatherPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const emailSentRef = useRef(false);
  const requestIdRef = useRef<string>(crypto.randomUUID());

  const logEvent = useCallback(
    async (severity: 'info' | 'error', message: string, metadata: Record<string, any> = {}) => {
      try {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            severity,
            source: 'WeatherPage',
            message,
            requestId: requestIdRef.current,
            metadata,
          }),
        });
      } catch (err) {
        console.error('Failed to log event:', err);
      }
    },
    []
  );

  const handleSendEmail = useCallback(async () => {
    if (!forecast || forecast.forecast.length === 0) {
      toast.error('Forecast not loaded yet');
      return;
    }

    try {
      await sendForecastEmail(forecast.forecast, requestIdRef.current);
      toast.success('Forecast email sent!');
      await logEvent('info', 'Forecast email sent successfully', {
        forecastLength: forecast.forecast.length,
      });
    } catch (err) {
      console.error('Failed to send forecast email:', err);
      toast.error('Failed to send forecast email');
      await logEvent('error', 'Forecast email failed', { error: String(err) });
    }
  }, [forecast, logEvent]);

  // Fetch forecast on mount
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const result = await getDailyForecast(requestIdRef.current);
        setForecast(result);
        await logEvent('info', 'Forecast fetched successfully', {
          forecastLength: result.forecast.length,
          maxRainAccumulation: result.maxRainAccumulation,
        });
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        toast.error('Failed to fetch forecast');
        await logEvent('error', 'Forecast fetch failed', { error: String(err) });
      }
    };
    fetchForecast();
  }, [logEvent]);

  // Auto-send once after forecast loads
  useEffect(() => {
    if (forecast && forecast.forecast.length > 0 && !emailSentRef.current) {
      emailSentRef.current = true;
      handleSendEmail();
    }
  }, [forecast, handleSendEmail]);

  if (!forecast || forecast.forecast.length === 0) return <p>Loading forecast...</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">7-Day Forecast (Email + Logs)</h2>

      <ul className="space-y-2">
        {forecast.forecast.map((day) => (
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
