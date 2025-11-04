import { getWeather } from '@/app/actions/getWeather';
import { db } from '@/app/lib/db';
import { generateUUID } from '../../../uuidj';

export async function GET() {
  const requestId = generateUUID();
  console.log('In api weather route');
  await db.log
    .create({
      data: {
        severity: 'info',
        source: 'weather-cron',
        message: `Weather cron ran at ${new Date().toISOString()}`,
        requestId,
      },
    })
    .catch(console.error);
  await getWeather(requestId);
  return new Response('Weather logged');
}
