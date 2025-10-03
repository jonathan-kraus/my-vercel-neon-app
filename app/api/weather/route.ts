// app/api/weather/route.ts
import { getWeather } from '@/app/actions/getWeather';
console.log('API route for weather called');
export async function GET() {
  await getWeather();
  return new Response('Weather logged');
}
