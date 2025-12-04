import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import toast from 'react-hot-toast';

import type { WeatherHourlyPayload } from '../weather/hourly/route';

export async function GET() {
  const requestId = generateUUID();
  // Generate some test logs
  const log = createLogger('api/test', requestId);
  await log.info('api test info ', { action: 'checkDbConnection', email: 'bypass_throttle' });
  await log.error('api test error', { action: 'checkDbConnection', email: 'bypass_throttle' });
  await log.warn('api test warn ', { action: 'checkDbConnection', email: 'bypass_throttle' });

  const fetchData = async () => {
    const res = await fetch('/api/weather/hourly');
    const data: WeatherHourlyPayload[] = await res.json();

    await log.info('Weather data fetched for toast:', data);
    const nonZero = data.some((row) =>
      [
        row.rainAccumulationAvg,
        row.rainAccumulationMax,
        row.rainAccumulationMin,
        row.rainAccumulationSum,
      ].some((val) => val > 0)
    );

    if (nonZero) {
      const message = data
        .map((row) => {
          const time = new Date(row.forecastTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return `${time} → Avg: ${row.rainAccumulationAvg}, Max: ${row.rainAccumulationMax}, Min: ${row.rainAccumulationMin}, Sum: ${row.rainAccumulationSum}`;
        })
        .join('\n');

      toast.dismiss();
      toast(`🌧 Rain Accumulation (Next 5 Hours)\n${message}`);
    }
  };

  fetchData();

  return new Response('Test logs generated successfully ');
}
