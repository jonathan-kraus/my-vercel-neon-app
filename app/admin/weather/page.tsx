import WeatherCard from "@/app/components/WeatherCard";


import HourlyForecastChart from '@/app/components/HourlyForecastChart';
//import { getHourlyForecast } from '@/app/actions/getWeather';




export default function WeatherPage() {
  return (
    <main className="p-6 space-y-6">
      <WeatherCard />
      <HourlyForecastChart />
    </main>
  );
}
