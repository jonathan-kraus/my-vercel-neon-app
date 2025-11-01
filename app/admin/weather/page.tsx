'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { sendForecastEmail } from '@/app/lib/sendForecastEmail';
import DailyForecastCard from '@/app/components/DailyForecastCard';
import SendForecastEmailButton from '@/app/components/SendForecastEmailButton';

type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function WeatherPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [requestId] = useState<string>(crypto.randomUUID());
  const emailSentRef = useRef(false);

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
            requestId,
            metadata,
          }),
        });
      } catch (err) {
        console.error('Failed to log event:', err);
      }
    },
    [requestId]
  );

  // Fetch forecast on mount
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const result = await getDailyForecast(requestId);
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
  }, [logEvent, requestId]);

  // Auto-send once after forecast loads
  useEffect(() => {
    if (forecast && forecast.forecast.length > 0 && !emailSentRef.current) {
      emailSentRef.current = true;
      // Auto-send email
      sendForecastEmail(forecast.forecast, requestId)
        .then(() => {
          logEvent('info', 'Forecast email sent successfully', {
            forecastLength: forecast.forecast.length,
          });
        })
        .catch((err) => {
          console.error('Failed to send forecast email:', err);
          logEvent('error', 'Forecast email failed', { error: String(err) });
        });
    }
  }, [forecast, requestId, logEvent]);

  if (!forecast || forecast.forecast.length === 0) return <p>Loading forecast...</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">7-Day Forecast (Email + Logs)</h2>

      <DailyForecastCard forecast={forecast.forecast} />

      <SendForecastEmailButton
        forecast={forecast.forecast}
        requestId={requestId}
        onLog={logEvent}
      />
    </div>
  );
}
