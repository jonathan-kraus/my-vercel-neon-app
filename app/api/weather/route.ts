/**
 * @vercel/cron 0 13 * * *
 */

import { getWeather } from '@/app/actions/getWeather';

export async function GET() {
  await getWeather();
  return new Response('Weather logged');
}
