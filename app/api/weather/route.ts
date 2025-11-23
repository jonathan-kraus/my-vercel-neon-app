import { getWeather } from '@/app/actions/getWeather';
import { generateUUID } from '../../../uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET() {
  const requestId = generateUUID();
  const log = createLogger('app/api/weather/route.ts');

  try {
    await log.info(`Weather cron ran at ${new Date().toISOString()}`);
  } catch (err) {
    // Fallback if logging fails
    console.warn('[weather] Failed to log cron run:', err);
  }

  await getWeather(requestId);
  return new Response('Weather logged');
}
