// Weather utility functions for converting weather codes to icons and labels

export function getIcon(code: number): string {
  // Weather code mapping based on Tomorrow.io API
  const iconMap: Record<number, string> = {
    1000: '☀️', // Clear
    1001: '☁️', // Cloudy
    1100: '⛅', // Mostly Clear
    1101: '☁️', // Partly Cloudy
    1102: '☁️', // Mostly Cloudy
    2000: '🌫️', // Fog
    2100: '🌫️', // Light Fog
    3000: '🌧️', // Light Rain
    3001: '🌧️', // Rain
    3002: '🌧️', // Heavy Rain
    4000: '🌧️', // Light Drizzle
    4001: '🌧️', // Drizzle
    5000: '🌨️', // Snow
    5001: '🌨️', // Flurries
    5100: '🌨️', // Light Snow
    5101: '❄️', // Heavy Snow
    6000: '🌧️', // Freezing Drizzle
    6001: '🌧️', // Freezing Rain
    6200: '🌨️', // Light Freezing Rain
    6201: '🌨️', // Heavy Freezing Rain
    7000: '🌧️', // Ice Pellets
    7101: '🌧️', // Heavy Ice Pellets
    7102: '🌧️', // Light Ice Pellets
    8000: '⛈️', // Thunderstorm
  };

  return iconMap[code] || '❓';
}

export function getLabel(code: number): string {
  // Weather code mapping based on Tomorrow.io API
  const labelMap: Record<number, string> = {
    1000: 'Clear',
    1001: 'Cloudy',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    2000: 'Fog',
    2100: 'Light Fog',
    3000: 'Light Rain',
    3001: 'Rain',
    3002: 'Heavy Rain',
    4000: 'Light Drizzle',
    4001: 'Drizzle',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    6000: 'Freezing Drizzle',
    6001: 'Freezing Rain',
    6200: 'Light Freezing Rain',
    6201: 'Heavy Freezing Rain',
    7000: 'Ice Pellets',
    7101: 'Heavy Ice Pellets',
    7102: 'Light Ice Pellets',
    8000: 'Thunderstorm',
  };

  return labelMap[code] || 'Unknown';
}
