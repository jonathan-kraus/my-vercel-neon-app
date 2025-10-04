import { PrismaClient } from '@prisma/client';
import { triggerEmail } from '@/components/actions';

const prisma = new PrismaClient();

export async function fetchWeather() {
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = '02445';
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

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

  console.log(`[getWeather] Hours since last email log: ${hoursSinceLast}`);

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

      await prisma.weatherLog.update({
        where: { id: 1 },
        data: {
          temperature: values.temperature,
          humidity: values.humidity,
          windSpeed: values.windSpeed,
          windGust: values.windGust,
          precipitationProbability: values.precipitationProbability,
          weatherCode: values.weatherCode,
          createdAt: now,
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
