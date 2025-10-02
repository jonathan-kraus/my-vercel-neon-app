'use server';

export type DailyForecastPoint = {
  time: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  conditions: string;
};

export async function getDailyForecast(): Promise<DailyForecastPoint[]> {
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = '02445'; // Brookline, MA ZIP code

  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${zip}&timesteps=1d&units=imperial&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch daily forecast');

  const data = await res.json();
  const daily = data.timelines.daily;

  return daily.slice(0, 7).map((day: any) => ({
    time: day.time,
    temperatureMax: day.values.temperatureMax,
    temperatureMin: day.values.temperatureMin,
    precipitation: day.values.precipitationProbability,
    conditions: day.values.weatherCode,
  }));
}
