import { getWeather } from '@/app/actions/getWeather';
import { createLog } from '@/app/utils/db';

  
export async function GET() {
  console.log('In api weather route');
  createLog({authorId: 1101,title: 'cron',content: `Weather cron ran at ${new Date().toISOString()}`}).catch(console.error);
  await getWeather('02245'); // Example ZIP code
  return new Response('Weather logged');
}
