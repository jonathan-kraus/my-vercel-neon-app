'use server';

export type DailyForecastPoint = {
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
console.log('GetDailyForecast module loaded');
export async function getDailyForecast(): Promise<DailyForecastPoint[]> {
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${zip}&timesteps=1d&units=imperial&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch daily forecast');

  const data = await res.json();
const daily: RawDailyEntry[] = data.timelines?.daily;
//const daily = data.timelines?.daily ?? [];
console.log('Raw daily values:', daily.map(d => d.values));
console.log('JJJ daily entries:', daily);
  return daily.slice(0, 7).map((day): DailyForecastPoint => ({
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