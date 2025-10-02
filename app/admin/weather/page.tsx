import WeatherCard from "@/app/components/WeatherCard";


import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import { getHourlyForecast } from '@/app/actions/getWeather';

export default async function WeatherPage() {
  const forecast = await getHourlyForecast();

  return (
    <main className="p-6 space-y-6">
      <WeatherCard />
      <HourlyForecastChart data={forecast} />
    </main>
  );
}
