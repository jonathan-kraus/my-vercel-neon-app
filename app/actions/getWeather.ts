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
};

const prisma = new PrismaClient();
export async function getWeather(): Promise<WeatherResponse> {
  const apiKey = process.env.TOMORROW_API_KEY;
  //const lat = 40.089; // Upper Merion latitude
  //const lon = -75.383; // Upper Merion longitude
  const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;

  //const url = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  console.log('Realtime weather values:', data.data.values);
const now = new Date();
let emailSent = false; // ✅ Declare here so it's always available
  // Check last weather log
  const latestLog = await prisma.weatherLog.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const hoursSinceLast = latestLog ? (now.getTime() - latestLog.createdAt.getTime()) / 3600000 : Infinity;
console.log('Hours since last log:', hoursSinceLast);
  const values = data.data.values;
  // If it's been more than 24 hours, send email and log weather
  if (hoursSinceLast >= 24) {
    try {
  await triggerEmail("Weather");
  emailSent = true; // Mark that email was sent
} catch (err) {
  console.error('Email failed:', err);
}


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
  }
  return {
    temperature: data.data.values.temperature,
    humidity: data.data.values.humidity,
    windSpeed: data.data.values.windSpeed,
    windGust: data.data.values.windGust,
    precipitationProbability: data.data.values.precipitationProbability,
    conditions: {
      day: data.data.values.weatherCode ?? -1,
      night: data.data.values.weatherCode ?? -1,
    },
    emailSent, 
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