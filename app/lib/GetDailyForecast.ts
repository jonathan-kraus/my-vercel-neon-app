'use server';

import { toast } from "react-hot-toast";
import { sendConfirmationEmail } from "../utils/email-client";

export type DailyForecastPoint = {
  requestId?: string;
  time: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
    conditions: {
    day: number;
    night: number;
};
  rainAccumulationAvg: number,
  rainAccumulationMax: number,
  rainAccumulationMin: number,
  rainAccumulationSum: number,
};
type RawDailyEntry = {
  time: string;
  values: {
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbability: number;
    weatherCodeMax: number;
    weatherCodeMin: number;
    rainAccumulationAvg: number,
    rainAccumulationMax: number,
    rainAccumulationMin: number,
    rainAccumulationSum: number,
  };
};


export async function getDailyForecast(requestId?: string): Promise<DailyForecastPoint[]> {
  console.log(`[getDailyForecast] [${requestId}] Function started`);
  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');
  console.log(`[getDailyForecast] [${requestId}] Using API key: ${apiKey.slice(0, 4)}...`);

  if (!requestId) requestId = 'requestid-not-passed'; //crypto.randomUUID();
  console.log(`[getDailyForecast] [${requestId}] getDailyForecast started`);
  //const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/forecast?location=42.3317,-71.1212&timesteps=1d&units=imperial&apikey=${apiKey}`;
  
  const res = await fetch(url);
      if (!res.ok) {
      console.error(`[Tomorrow.io] ❌ HTTP error: ${res.status}`);
      return []; // Return empty array to avoid frontend crash
    }

  const data = await res.json();

      if (!data || !data.timelines || !Array.isArray(data.timelines.daily)) {
      console.warn(`[Tomorrow.io] ⚠️ Unexpected response format`, data);
      return []; // Defensive fallback
    }
      try {
      
      const emailData = {
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: 'Get Daily Forecast Page Clicked',
      requestId: requestId,
    };
       const { success, message } = await sendConfirmationEmail(emailData);

    if (success) {
      toast.success(`[${requestId}] Success! ${message}`);
    } else {
      toast.error(`[${requestId}] Error: ${message}`);
    }
      console.log(`Email sent, GDF ${requestId}`);
      
    } catch (err) {
      console.error(`[Email failed: ${requestId}]`, err);
      
  }

  console.log(`[GetDailyForecast] [${requestId}] Forecast response:`, data);
const daily: RawDailyEntry[] = data.timelines?.daily;
//const daily = data.timelines?.daily ?? [];
console.log(`[${requestId}] Raw daily forecastvalues:`, daily.map(d => d.values));
console.log(`[${requestId}] JJJ daily entries:`, daily);
  return daily.slice(0, 7).map((day): DailyForecastPoint => ({
    requestId,
    time: day.time,
    temperatureMax: day.values?.temperatureMax ?? 0,
    temperatureMin: day.values?.temperatureMin ?? 0,
    precipitation: day.values?.precipitationProbability ?? 0,
    conditions: {
      day: day.values.weatherCodeMax ?? -1,
      night: day.values.weatherCodeMin ?? -1,
    },
    rainAccumulationAvg: day.values?.rainAccumulationAvg ?? 0,
    rainAccumulationMax: day.values?.rainAccumulationMax ?? 0,
    rainAccumulationMin: day.values?.rainAccumulationMin ?? 0,
    rainAccumulationSum: day.values?.rainAccumulationSum ?? 0,

  }));
}