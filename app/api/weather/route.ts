/**
 * @vercel/cron 0 13 * * *
 */

import { getWeather } from '@/lib/getWeather';

export async function GET() {
  await getWeather();
  return new Response('Weather logged');
}
