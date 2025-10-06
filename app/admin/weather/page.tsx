import WeatherCard from "@/app/components/WeatherCard";


import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import DailyForecastCard from "@/app/components/DailyForecastCard";
//import { getHourlyForecast } from '@/app/actions/getWeather';




export default function WeatherPage() {
  return (
    <main className="p-6 space-y-6">
      <WeatherCard zip = '02245'/>
      <HourlyForecastChart />
      <DailyForecastCard zip = '02245'/>
    </main>
  );
}
