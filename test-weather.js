import { fetchWeather } from './app/lib/fetchWeather.js';

async function test() {
  try {
    const result = await fetchWeather('test-request-id');
    console.log('Weather result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
