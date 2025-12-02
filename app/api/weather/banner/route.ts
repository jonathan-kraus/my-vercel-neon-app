// app/api/weather/banner/route.ts  (app router)
// app/lib/weatherBanner.ts  (lib)
// This file contains the logic to fetch weather data and determine if a rain banner should be shown.
import { NextResponse } from 'next/server';
import { getRainBannerForNextHours } from '@/app/lib/weatherBanner';

export async function GET(request: Request) {
  try {
    const location = process.env.LOCATION_NAME ?? 'kop';
    const hours = Number(process.env.BANNER_HOURS ?? 6);
    const probThreshold = Number(process.env.BANNER_PROB_THRESHOLD ?? 30);
    const accumThreshold = Number(process.env.BANNER_ACCUM_THRESHOLD ?? 0);

    const banner = await getRainBannerForNextHours(location, hours, probThreshold, accumThreshold);
    return NextResponse.json({ ok: true, banner });
  } catch (err) {
    (console.error('banner check failed', err), request);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
