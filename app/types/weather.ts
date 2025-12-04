// types/weather.ts
export type WeatherHourlyPayload = {
  timestamp: string; // ISO string when sent over JSON
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
};
