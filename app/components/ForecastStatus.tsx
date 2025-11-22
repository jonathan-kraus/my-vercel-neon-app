'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { sendForecastEmail } from '@/app/lib/sendForecastEmail';
import { generateUUID } from '../../uuidj';
import { createLogger } from '@/app/utils/logger';

const requestId = generateUUID();
const log = createLogger('app/components/ForecastStatus.tsx', requestId);
type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function ForecastStatus() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const emailSentRef = useRef(false);
  const requestIdRef = useRef<string>(generateUUID());

  const handleSendEmail = useCallback(async () => {
    if (!forecast) {
      toast.error('Forecast not loaded yet');
      return;
    }
    try {
      await sendForecastEmail(forecast.forecast, requestIdRef.current);
      toast.success('Forecast email success!');
      await log.info('Success: Forecast auto send email', {
        forecastLength: forecast.forecast.length,
      });
    } catch (err) {
      console.error('Failed to send forecast email:', err);
      toast.error('Failed to send forecast email');
    }
  }, [forecast]);

  // now effects can safely use them
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const result = await getDailyForecast(requestIdRef.current);
        setForecast(result);
        await log.info('Forecast fetched successfully', {
          forecastLength: result.forecast.length,
          maxRainAccumulation: result.maxRainAccumulation,
        });
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        toast.error('Failed to fetch forecast');
      }
    };
    fetchForecast();
  }, []);

  useEffect(() => {
    if (forecast && !emailSentRef.current) {
      emailSentRef.current = true;
      handleSendEmail();
    }
  }, [forecast, handleSendEmail]);

  if (!forecast) return <p>Loading forecast...</p>;

  return (
    <div>
      <h2>7-Day Forecast</h2>
      <ul>
        {forecast.forecast.map((day) => (
          <li key={day.time}>
            {new Date(day.time).toLocaleDateString()} — High: {day.temperatureMax}°F, Low:{' '}
            {day.temperatureMin}°F
          </li>
        ))}
      </ul>
      <button onClick={handleSendEmail}>Send Forecast Email</button>
    </div>
  );
}
