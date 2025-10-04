import { getWeather } from '@/app/actions/getWeather';
import { createLog } from '@/app/utils/db';

  console.log('In api weather route');
  createLog({authorId: 1101,title: 'cron',content: `Weather cron ran at ${new Date().toISOString()}`}).catch(console.error);
export async function GET() {
  await getWeather();
  return new Response('Weather logged');
}
