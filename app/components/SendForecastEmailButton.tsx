'use client';

import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { sendForecastEmail } from '@/app/lib/sendForecastEmail';
import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';

type SendForecastEmailButtonProps = {
  forecast: DailyForecastPoint[];
  requestId: string;
  onLog: (
    severity: 'info' | 'error',
    message: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
};

export default function SendForecastEmailButton({
  forecast,
  requestId,
  onLog,
}: SendForecastEmailButtonProps) {
  const handleSendEmail = useCallback(async () => {
    if (!forecast || forecast.length === 0) {
      toast.error('Forecast not loaded yet');
      return;
    }

    try {
      await sendForecastEmail(forecast, requestId);
      toast.success('Forecast email success!');
      await onLog('info', 'Success: Forecast auto send email', {
        forecastLength: forecast.length,
      });
    } catch (err) {
      console.error('Failed to send forecast email:', err);
      toast.error('Failed to send forecast email');
      await onLog('error', 'Forecast email failed', { error: String(err) });
    }
  }, [forecast, requestId, onLog]);

  return (
    <button onClick={handleSendEmail} className="px-3 py-1 bg-blue-500 text-white rounded">
      Send Forecast Email
    </button>
  );
}
