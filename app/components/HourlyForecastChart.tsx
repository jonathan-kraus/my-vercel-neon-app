import { Line } from 'react-chartjs-2';
type ForecastPoint = {
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
};

export default function HourlyForecastChart({ data }: { data: ForecastPoint[] }) {
  const chartData = {
    labels: data.map(d => new Date(d.time).toLocaleTimeString()),
    datasets: [
      {
        label: 'Temperature (°F)',
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
