'use client';

import { useEffect, useState } from 'react';
import { getHourlyForecast } from '@/app/actions/getWeather';
import { Line } from 'react-chartjs-2';

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ForecastPoint = {
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
};

export default function HourlyForecastChart() {
  const [data, setData] = useState<ForecastPoint[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const forecast = await getHourlyForecast();
      setData(forecast);
    };
    fetch();
  }, []);

  if (!data.length) return <p>Loading chart...</p>;

  const chartData = {
    labels: data.map(d => new Date(d.time).toLocaleTimeString()),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data.map(d => d.temperature),
        borderColor: 'orange',
        fill: false,
      },
      {
        label: 'Precipitation (%)',
        data: data.map(d => d.precipitation),
        borderColor: 'blue',
        fill: false,
      },
    ],
  };

  return <Line data={chartData} />;
}
