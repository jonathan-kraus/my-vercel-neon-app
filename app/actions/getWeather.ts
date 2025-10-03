'use server';
import { PrismaClient } from '@prisma/client';
import { triggerEmail } from "../components/actions";

type WeatherResponse = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  conditions: { day: number; night: number };
  emailSent: boolean;
  lastEmailTimestamp: string | null;
};

const prisma = new PrismaClient();

export async function getWeather(): Promise<WeatherResponse> {
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;
if (!apiKey) {
  console.error('❌ Missing TOMORROW_API_KEY');
  throw new Error('Missing TOMORROW_API_KEY');
}

  const res = await fetch(url);
if (!res.ok) {
  const errorBody = await res.text();
  console.error('❌ Tomorrow.io API error:', errorBody);
  throw new Error('Failed to fetch weather');
}

  const data = await res.json();
  const values = data.data.values;
  const now = new Date();

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

  if (hoursSinceLast >= 24) {
    try {
      await triggerEmail("Weather");

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

      emailSent = true;
      lastEmailTimestamp = now.toISOString();

      console.log('✅ Weather email sent and log created');
    } catch (err) {
      console.error('❌ Email failed:', err);
    }
  } else {
    console.log('⏱️ Email already sent within the last 24 hours');
  }

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
    emailSent,
    lastEmailTimestamp,
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
  if (!apiKey) {
  console.error('❌ Missing TOMORROW_API_KEY');
  throw new Error('Missing TOMORROW_API_KEY');
}

  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${zip}&timesteps=1h&units=imperial&apikey=${apiKey}`;
  const res = await fetch(url);
if (!res.ok) {
  const errorBody = await res.text();
  console.error('❌ Tomorrow.io API error:', errorBody);
  throw new Error('Failed to fetch weather');
}


  const data = await res.json();
  const hourly: HourlyForecastEntry[] = data.timelines.hourly;

  return hourly.slice(0, 12).map(hour => ({
    time: hour.time,
    temperature: hour.values.temperature,
    precipitation: hour.values.precipitationProbability,
    windSpeed: hour.values.windSpeed,
  }));
}