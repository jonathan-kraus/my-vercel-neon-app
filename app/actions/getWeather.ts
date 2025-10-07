'use server';
import { PrismaClient } from '@prisma/client';
//import { triggerEmail } from "../components/actions";

type WeatherResponse = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  conditions: { day: number; night: number };
  emailSent?: boolean;
  lastEmailTimestamp: string | null;
  requestId?: string;
  locationName?: string; // ✅ Add this
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
};



const prisma = new PrismaClient();

export async function getWeather(): Promise<WeatherResponse> {
  const requestId = crypto.randomUUID();
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;
console.log(`[getWeather] [${requestId}] Server function started at ${new Date().toISOString()}`);
if (typeof window !== 'undefined') {
  console.log(`[getWeather] [${requestId}] Running on the client`);
} else {
  console.log(`[getWeather] [${requestId}] Running on the server`);
}
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const now = new Date();
console.log(`[${requestId}] Raw weather API response:`, data);

  let emailSent = false;
  let lastEmailTimestamp: string | null = null;

  const latestLog = await prisma.weatherLog.findFirst({
    where: { emailSent: true },
    orderBy: { createdAt: 'desc' },
  });

  const hoursSinceLast = latestLog
    ? (now.getTime() - latestLog.createdAt.getTime()) / 3600000
    : Infinity;

  if (latestLog) {
    lastEmailTimestamp = latestLog.createdAt.toISOString();
  }

  console.log('Hours since last email log:', hoursSinceLast);

  if (hoursSinceLast > 2) {
    try {
      //await triggerEmail("Weather", latestLog ? latestLog.id.toString() : undefined);

      await prisma.weatherLog.create({
        data: {
          temperature: values.temperature,
          humidity: values.humidity,
          windSpeed: values.windSpeed,
          windGust: values.windGust,
          precipitationProbability: values.precipitationProbability,
          weatherCode: values.weatherCode,
          emailSent: true,
        },
      });
            // update row 1 for last update time
      await prisma.weatherLog.update({
  where: { id: 1 },
  data: {
    temperature: data.temperature,
    humidity: data.humidity,
    windSpeed: data.windSpeed,
    windGust: data.windGust,
    precipitationProbability: data.precipitationProbability,
    weatherCode: data.weatherCode,
    //emailSent: false, // or preserve existing value
    createdAt: new Date(), // 👈 this marks the last update
  },});

      emailSent = true;
      lastEmailTimestamp = now.toISOString();

      console.log('✅ Weather email sent and log created');
    } catch (err) {
      console.error('❌ Email failed:', err);
    }
  } else {
    console.log('⏱️ Email already sent within the last 24 hours');
  }
const locationName = data.location?.name ?? 'Unknown';
console.log(`Weather data fetched [${requestId}] for ${locationName}:`, values);
return {
  temperature: values.temperature,
  humidity: values.humidity,
  windSpeed: values.windSpeed,
  windGust: values.windGust,
  precipitationProbability: values.precipitationProbability,
  conditions: {
    day: values.weatherCode ?? -1,
    night: values.weatherCode ?? -1,
  },
  rainAccumulationAvg: values.rainAccumulationAvg,
  rainAccumulationMax: values.rainAccumulationMax,
  rainAccumulationMin: values.rainAccumulationMin,
  rainAccumulationSum: values.rainAccumulationSum,
  locationName, // ✅ Include it here
  emailSent,
  lastEmailTimestamp,
  requestId,
};
}
type HourlyForecastEntry = {
  time: string;
  values: {
    temperature: number;
    precipitationProbability: number;
    windSpeed: number;
  };
};

export async function getHourlyForecast(): Promise<
  { time: string; temperature: number; precipitation: number; windSpeed: number }[]
> {
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${zip}&timesteps=1h&units=imperial&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');

  const data = await res.json();
  const hourly: HourlyForecastEntry[] = data.timelines.hourly;

  return hourly.slice(0, 12).map(hour => ({
    time: hour.time,
    temperature: hour.values.temperature,
    precipitation: hour.values.precipitationProbability,
    windSpeed: hour.values.windSpeed,
  }));
}