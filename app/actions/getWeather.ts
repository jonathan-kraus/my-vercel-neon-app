'use server';

export async function getWeather() {
  const apiKey = process.env.TOMORROW_API_KEY;
  //const lat = 40.089; // Upper Merion latitude
  //const lon = -75.383; // Upper Merion longitude
  const zip = '02445'; // Brookline, MA ZIP code
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;
  //const url = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();

  return {
    temperature: data.data.values.temperature,
    humidity: data.data.values.humidity,
    windSpeed: data.data.values.windSpeed,
    windGust: data.data.values.windGust,
    precipitationProbability: data.data.values.precipitationProbability,
    conditions: data.data.values.weatherCode
  };
}
